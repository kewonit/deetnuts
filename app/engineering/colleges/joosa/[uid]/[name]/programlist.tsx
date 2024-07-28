// ProgramList.tsx (Client Component)
'use client';
import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RankData = {
  'Opening Rank': number;
  'Closing Rank': number;
  'Quota': string;
  'Seat Type': string;
  'Gender': string;
};

type YearRoundData = {
  [key: string]: RankData[];
};

type ProgramData = {
  'Program Name': string;
  'Seat Pool': string;
  'State/All India Seats': string;
  'Ranks': YearRoundData;
};

type ProgramListProps = {
  programs: ProgramData[];
};

const ProgramList: React.FC<ProgramListProps> = ({ programs }) => {
  const [seatPoolValue, setSeatPoolValue] = useState<string>('all');
  const [stateAllIndiaValue, setStateAllIndiaValue] = useState<string>('all');
  const [programTypeValue, setProgramTypeValue] = useState<string>('all');
  const [yearRoundValue, setYearRoundValue] = useState<string>('all');
  const [quotaValue, setQuotaValue] = useState<string>('all');
  const [seatTypeValue, setSeatTypeValue] = useState<string>('all');
  const [genderValue, setGenderValue] = useState<string>('all');

  const uniqueSeatPools = useMemo(() => {
    const options = new Set(programs.map(program => program['Seat Pool']));
    return Array.from(options).sort();
  }, [programs]);

  const uniqueStateAllIndia = useMemo(() => {
    const options = new Set(programs.map(program => program['State/All India Seats']));
    return Array.from(options).sort();
  }, [programs]);

  const uniqueProgramTypes = useMemo(() => {
    const options = new Set(programs.map(program => {
      const match = program['Program Name'].match(/\((.*?)\)/);
      return match ? `(${match[1]})` : 'Unknown';
    }));
    return Array.from(options).sort();
  }, [programs]);

  const uniqueYearRounds = useMemo(() => {
    const options = new Set(
      programs.flatMap(program => Object.keys(program.Ranks))
    );
    return Array.from(options).sort();
  }, [programs]);

  const uniqueQuotas = useMemo(() => {
    const options = new Set(programs.flatMap(program => 
      Object.values(program.Ranks).flatMap(ranks => ranks.map(rank => rank.Quota))
    ));
    return Array.from(options).sort();
  }, [programs]);

  const uniqueSeatTypes = useMemo(() => {
    const options = new Set(programs.flatMap(program => 
      Object.values(program.Ranks).flatMap(ranks => ranks.map(rank => rank['Seat Type']))
    ));
    return Array.from(options).sort();
  }, [programs]);

  const uniqueGenders = useMemo(() => {
    const options = new Set(programs.flatMap(program => 
      Object.values(program.Ranks).flatMap(ranks => ranks.map(rank => rank.Gender))
    ));
    return Array.from(options).sort();
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(program => 
      (seatPoolValue === 'all' || program['Seat Pool'] === seatPoolValue) &&
      (stateAllIndiaValue === 'all' || program['State/All India Seats'] === stateAllIndiaValue) &&
      (programTypeValue === 'all' || program['Program Name'].includes(programTypeValue))
    );
  }, [programs, seatPoolValue, stateAllIndiaValue, programTypeValue]);

  const chartData = useMemo(() => {
    if (yearRoundValue === 'all' || seatTypeValue === 'all') {
      return [];
    }

    return filteredPrograms.map(program => {
      const ranks = program.Ranks[yearRoundValue] || [];
      const filteredRanks = ranks.filter(rank => 
        (quotaValue === 'all' || rank.Quota === quotaValue) &&
        (seatTypeValue === 'all' || rank['Seat Type'] === seatTypeValue) &&
        (genderValue === 'all' || rank.Gender === genderValue)
      );
      
      if (filteredRanks.length === 0) return null;

      return {
        name: program['Program Name'],
        opening: Math.min(...filteredRanks.map(r => r['Opening Rank'])),
        closing: Math.max(...filteredRanks.map(r => r['Closing Rank'])),
      };
    }).filter((data): data is { name: string; opening: number; closing: number } => data !== null);
  }, [filteredPrograms, yearRoundValue, quotaValue, seatTypeValue, genderValue]);

  const chartConfig = {
    opening: {
      label: "Opening Rank",
      color: "hsl(var(--chart-1))",
    },
    closing: {
      label: "Closing Rank",
      color: "hsl(var(--chart-2))",
    },
  };

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    const words = payload.value.split(' ');
    const lineHeight = 12;
    const maxWordsPerLine = 3;
    const lines = [];
    
    for (let i = 0; i < words.length; i += maxWordsPerLine) {
      lines.push(words.slice(i, i + maxWordsPerLine).join(' '));
    }

    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={0}
            dy={10 + index * lineHeight}
            textAnchor="end"
            fill="#666"
            fontSize={10}
            transform="rotate(-45)"
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  
  return (
    <Card>
      <CardContent>
        <div className="space-y-4 pt-4">
        <h2 className="text-2xl font-bold mb-4">Programs Offered:</h2>
          <div className="grid grid-flow-row md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div>
              <Label htmlFor="programType">Program Type</Label>
              <Select onValueChange={setProgramTypeValue} value={programTypeValue}>
                <SelectTrigger id="programType">
                  <SelectValue placeholder="Select a program type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueProgramTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="seatPool">Seat Pool</Label>
              <Select onValueChange={setSeatPoolValue} value={seatPoolValue}>
                <SelectTrigger id="seatPool">
                  <SelectValue placeholder="Select a seat pool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueSeatPools.map((pool) => (
                    <SelectItem key={pool} value={pool}>{pool}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stateAllIndia">State/All India Seats</Label>
              <Select onValueChange={setStateAllIndiaValue} value={stateAllIndiaValue}>
                <SelectTrigger id="stateAllIndia">
                  <SelectValue placeholder="Select a state or All India option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueStateAllIndia.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="yearRound">Year and Round</Label>
              <Select onValueChange={setYearRoundValue} value={yearRoundValue}>
                <SelectTrigger id="yearRound">
                  <SelectValue placeholder="Select a year and round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueYearRounds.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quota">Quota</Label>
              <Select onValueChange={setQuotaValue} value={quotaValue}>
                <SelectTrigger id="quota">
                  <SelectValue placeholder="Select a quota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueQuotas.map((quota) => (
                    <SelectItem key={quota} value={quota}>{quota}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="seatType">Seat Type</Label>
              <Select onValueChange={setSeatTypeValue} value={seatTypeValue}>
                <SelectTrigger id="seatType">
                  <SelectValue placeholder="Select a seat type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueSeatTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={setGenderValue} value={genderValue}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select a gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueGenders.map((gender) => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className='my-8'>
          <ProgramListDisplay 
            programs={filteredPrograms} 
            yearRound={yearRoundValue}
            quota={quotaValue}
            seatType={seatTypeValue}
            gender={genderValue}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Program Ranks</CardTitle>
            <CardDescription>Opening and Closing Ranks for Programs ({yearRoundValue})</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={500}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  interval={0} 
                  height={1}
                  tick={<CustomXAxisTick />}
                />
               
                <Tooltip />
                <Area type="monotone" dataKey="opening" name="Opening Rank" stroke={chartConfig.opening.color} fill={chartConfig.opening.color} />
                <Area type="monotone" dataKey="closing" name="Closing Rank" stroke={chartConfig.closing.color} fill={chartConfig.closing.color} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 font-medium leading-none">
                  Trending ranks for programs <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </CardContent>
    </Card>
  );
};

const ProgramListDisplay: React.FC<{ 
  programs: ProgramData[], 
  yearRound: string,
  quota: string,
  seatType: string,
  gender: string
}> = ({ programs, yearRound, quota, seatType, gender }) => {
  // Check if Year and Round & Seat Type are selected
  if (yearRound === 'all' || seatType === 'all') {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Program Name</TableHead>
            <TableHead>Seat Pool</TableHead>
            <TableHead>State/All India Seats</TableHead>
            <TableHead>Opening Rank</TableHead>
            <TableHead>Closing Rank</TableHead>
            <TableHead>Quota</TableHead>
            <TableHead>Seat Type</TableHead>
            <TableHead>Gender</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8}>Select both Year and Round & Seat Type to view ranks</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  const filteredPrograms = programs.filter(program => 
    yearRound !== 'all' && program.Ranks[yearRound]
  );

  if (filteredPrograms.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Program Name</TableHead>
            <TableHead>Seat Pool</TableHead>
            <TableHead>State/All India Seats</TableHead>
            <TableHead>Opening Rank</TableHead>
            <TableHead>Closing Rank</TableHead>
            <TableHead>Quota</TableHead>
            <TableHead>Seat Type</TableHead>
            <TableHead>Gender</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8}>No data available for the selected criteria</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Program Name</TableHead>
          <TableHead>Seat Pool</TableHead>
          <TableHead>State/All India Seats</TableHead>
          <TableHead>Opening Rank</TableHead>
          <TableHead>Closing Rank</TableHead>
          <TableHead>Quota</TableHead>
          <TableHead>Seat Type</TableHead>
          <TableHead>Gender</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPrograms.map((program, index) => (
          program.Ranks[yearRound]
            .filter(rank => 
              (quota === 'all' || rank.Quota === quota) &&
              (seatType === 'all' || rank['Seat Type'] === seatType) &&
              (gender === 'all' || rank.Gender === gender)
            )
            .map((rank, rankIndex) => (
              <TableRow key={`${index}-${rankIndex}`}>
                <TableCell>{program['Program Name']}</TableCell>
                <TableCell>{program['Seat Pool']}</TableCell>
                <TableCell>{program['State/All India Seats']}</TableCell>
                <TableCell>{rank['Opening Rank']}</TableCell>
                <TableCell>{rank['Closing Rank']}</TableCell>
                <TableCell>{rank.Quota}</TableCell>
                <TableCell>{rank['Seat Type']}</TableCell>
                <TableCell>{rank.Gender}</TableCell>
              </TableRow>
            ))
        ))}
      </TableBody>
    </Table>
  );
};

export default ProgramList;