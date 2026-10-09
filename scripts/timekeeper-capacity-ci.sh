#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# This runs only on an ephemeral GitHub runner, never on the production Droplet.
[[ ${GITHUB_ACTIONS:-} == true && ${RUNNER_OS:-} == Linux ]] || {
  echo 'Capacity CI requires an isolated Linux GitHub runner' >&2
  exit 1
}
tk_root=$PWD
tk_work=$(mktemp -d "${RUNNER_TEMP:?}/timekeeper-capacity.XXXXXX")
tk_output="$tk_root/capacity-output"
mkdir -p "$tk_output"
tk_prefix="tkcapacity${GITHUB_RUN_ID:?}${GITHUB_RUN_ATTEMPT:?}"
tk_network="$tk_prefix"
tk_parent="${tk_prefix}.slice"
tk_driver=$(docker info --format '{{.CgroupDriver}}')
[[ $(docker info --format '{{.CgroupVersion}}') == 2 ]] || { echo 'Cgroup v2 is required' >&2; exit 1; }
read -r tk_cpu tk_generator_cpu < <(python3 - <<'PY'
import os
cpus=sorted(os.sched_getaffinity(0))
assert len(cpus)>1, 'A separate generator CPU is required'
print(cpus[0],cpus[1])
PY
)
cleanup() {
  for tk_service in web pocketbase; do
    docker logs --tail 200 "$tk_prefix-$tk_service" > "$tk_output/$tk_service.log" 2>&1 || true
  done
  docker rm -f "$tk_prefix-web" "$tk_prefix-pocketbase" >/dev/null 2>&1 || true
  docker network rm "$tk_network" >/dev/null 2>&1 || true
  if [[ "$tk_driver" == systemd ]]; then
    sudo systemctl stop "$tk_parent" >/dev/null 2>&1 || true
    sudo rm -f "/run/systemd/system/$tk_parent"
    sudo systemctl daemon-reload
  else
    sudo rmdir "/sys/fs/cgroup/$tk_prefix" 2>/dev/null || true
  fi
  sudo rm -rf -- "$tk_work"
}
trap cleanup EXIT

read -r tk_sha tk_web_image tk_pb_image < <(node -e '
const m=require("./docs/timekeeper-migration/capacity-images.json");
if(!/^[0-9a-f]{40}$/.test(m.releaseSha)||![m.images.web,m.images.pocketbase].every(x=>/^ghcr.io\/kewonit\/deetnuts-[a-z]+@sha256:[0-9a-f]{64}$/.test(x)))process.exit(1);
console.log(m.releaseSha,m.images.web,m.images.pocketbase);')
docker pull "$tk_web_image" >/dev/null
docker pull "$tk_pb_image" >/dev/null
[[ $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$tk_web_image") == "$tk_sha" ]]

if [[ "$tk_driver" == systemd ]]; then
  printf '[Unit]\nDescription=Isolated TimeKeeper capacity resources\n[Slice]\nCPUQuota=100%%\nMemoryMax=1536M\nMemorySwapMax=512M\nTasksMax=512\n' | sudo tee "/run/systemd/system/$tk_parent" >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl start "$tk_parent"
else
  tk_parent="/$tk_prefix"
  sudo mkdir "/sys/fs/cgroup$tk_parent"
  printf '100000 100000\n' | sudo tee "/sys/fs/cgroup$tk_parent/cpu.max" >/dev/null
  printf '1610612736\n' | sudo tee "/sys/fs/cgroup$tk_parent/memory.max" >/dev/null
  printf '536870912\n' | sudo tee "/sys/fs/cgroup$tk_parent/memory.swap.max" >/dev/null
fi

docker network create --internal "$tk_network" >/dev/null
mkdir -p "$tk_work/secrets" "$tk_work/data" "$tk_work/cache"
node - "$tk_work" <<'JS'
const fs=require("fs"),crypto=require("crypto"),root=process.argv[2];
const random=()=>crypto.randomBytes(32).toString("hex");
const secrets={pocketbase_encryption_key:random().slice(0,32),pocketbase_superuser_email:"capacity-admin@deetnuts.invalid",pocketbase_superuser_password:random(),pocketbase_migration_key:random()};
for(const [key,value] of Object.entries(secrets))fs.writeFileSync(`${root}/secrets/${key}`,value+"\n",{mode:0o600});
const env={NEXT_PUBLIC_APP_URL:"https://www.deetnuts.com",POCKETBASE_INTERNAL_URL:"http://pocketbase:8090",POCKETBASE_SERVICE_EMAIL:"capacity-backend@deetnuts.invalid",POCKETBASE_SERVICE_PASSWORD:random(),AUTH_STATE_SECRET:random(),TIMEKEEPER_SUPABASE_URL:"https://ivmobluuegkikmbwbfhe.supabase.co",TIMEKEEPER_SUPABASE_ANON_KEY:"sb_publishable_isolated_test_only",ADMISSIONS_V2_MHT_CET:"true",MHT_CET_ENABLED:"true"};
fs.writeFileSync(`${root}/web.env`,Object.entries(env).map(([k,v])=>`${k}=${v}`).join("\n")+"\n",{mode:0o600});
JS
sudo chown -R 10001:10001 "$tk_work/data" "$tk_work/secrets"
sudo chown -R 1001:1001 "$tk_work/cache"
tk_secret_args=()
for tk_secret in pocketbase_encryption_key pocketbase_superuser_email pocketbase_superuser_password pocketbase_migration_key; do
  tk_secret_args+=(--mount "type=bind,source=$tk_work/secrets/$tk_secret,target=/run/secrets/$tk_secret,readonly")
done
docker run -d --name "$tk_prefix-pocketbase" --network "$tk_network" --network-alias pocketbase --publish 127.0.0.1:8099:8090 --cgroup-parent "$tk_parent" --cpuset-cpus "$tk_cpu" --cpus 1 --memory 448m --memory-swap 640m --pids-limit 96 --read-only --user 10001:10001 --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,noexec,nosuid,size=16m,uid=10001,gid=10001,mode=1777 --mount "type=bind,source=$tk_work/data,target=/pb/pb_data" "${tk_secret_args[@]}" --env GOMEMLIMIT=320MiB "$tk_pb_image" >/dev/null
for tk_attempt in $(seq 1 40); do
  if curl --fail --silent http://127.0.0.1:8099/api/health >/dev/null; then break; fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:8099/api/health >/dev/null
sudo "$(command -v node)" scripts/timekeeper-capacity-seed.mjs "$tk_work" docs/timekeeper-migration/capacity-public-colleges.json

docker run -d --name "$tk_prefix-web" --network "$tk_network" --publish 127.0.0.1:3109:3000 --cgroup-parent "$tk_parent" --cpuset-cpus "$tk_cpu" --cpus 1 --memory 1024m --memory-swap 1280m --pids-limit 256 --read-only --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp:rw,noexec,nosuid,size=64m,uid=1001,gid=1001,mode=1777 --mount "type=bind,source=$tk_work/cache,target=/app/.next/cache" --env-file "$tk_work/web.env" --env "DEPLOYMENT_SHA=$tk_sha" --env NODE_ENV=production --env HOSTNAME=0.0.0.0 --env PORT=3000 --env NEXT_TELEMETRY_DISABLED=1 "$tk_web_image" >/dev/null
for tk_attempt in $(seq 1 40); do
  if curl --fail --silent http://127.0.0.1:3109/api/health >/dev/null; then break; fi
  sleep 2
done
curl --fail --silent http://127.0.0.1:3109/api/health >/dev/null

docker inspect "$tk_prefix-web" "$tk_prefix-pocketbase" > "$tk_work/inspect.json"
docker network inspect "$tk_network" > "$tk_work/network.json"
python3 - "$tk_work" "$tk_output/isolation.json" "$tk_parent" "$tk_cpu" "$tk_sha" <<'PY'
import sys,json,pathlib,datetime,subprocess
root=pathlib.Path(sys.argv[1]);services=json.loads((root/'inspect.json').read_text());network=json.loads((root/'network.json').read_text())[0]
assert network['Internal'] and len(services)==2
for service,mem,pids in zip(services,[1073741824,469762048],[256,96]):
    host=service['HostConfig']
    assert host['Memory']==mem and host['NanoCpus']==1000000000 and host['CpusetCpus']==sys.argv[4] and host['CgroupParent']==sys.argv[3] and host['PidsLimit']==pids
    assert host['ReadonlyRootfs'] and host['CapDrop']==['ALL']
    assert all(pathlib.Path(m['Source']).is_relative_to(root) for m in service['Mounts'] if m['Type']=='bind')
    assert service['State']['Running']
parent=pathlib.Path('/sys/fs/cgroup')/sys.argv[3].lstrip('/')
quota,period=map(int,(parent/'cpu.max').read_text().split());assert quota>0 and quota/period<=1
assert int((parent/'memory.max').read_text())==1610612736
report={'passed':True,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'releaseSha':sys.argv[5],'networkInternal':True,'productionSecretsOrVolumesMounted':False,'sharedCpuLimit':quota/period,'sharedMemoryLimitBytes':1610612736,'reservedForProductionOsAndSidecarsBytes':536870912,'dedicatedCandidateCpu':sys.argv[4],'generatorOutsideCandidateCgroup':True,'publicCollegeRecords':354,'services':[{ 'image':s['Config']['Image'],'memoryBytes':s['HostConfig']['Memory'],'nanoCpus':s['HostConfig']['NanoCpus'],'readOnly':s['HostConfig']['ReadonlyRootfs']} for s in services],'cpuModel':subprocess.check_output(['lscpu'],text=True),'limits':'Production container ceilings and one shared CPU; runner hardware differs from the DigitalOcean host. No live backend is reachable.'}
pathlib.Path(sys.argv[2]).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['cpuModel','services']}))
PY

taskset -c "$tk_generator_cpu" node scripts/timekeeper-capacity.mjs --config=docs/timekeeper-migration/capacity-observed.json --report="$tk_output/capacity.json"
docker stats --no-stream --format '{{.Name}} {{.CPUPerc}} {{.MemUsage}}' "$tk_prefix-web" "$tk_prefix-pocketbase" > "$tk_output/resources.txt"
