import { permanentRedirect } from "next/navigation";

export default function DataSourceRedirect() {
  permanentRedirect("/compliance/data-sources-and-licensing");
}
