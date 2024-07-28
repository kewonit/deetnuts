import Augillion from 'next/font/local';
const augillion = Augillion({
    src: '../../public/Augillion.otf',
    display: 'swap',
});

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const Scapers = () => {
  return (
    <div>
      <main>
        <section>
          <div className="container mx-auto mt-28 py-10">
            <div className={augillion.className}>
              <h1 className="text-6xl md:text-9xl text-center text-orange-400">
                Handcrafted Scraper(s)
              </h1>
            </div>
          </div>
        </section>
        <section className="container max-w-5xl pb-20">
        <Table>
          <TableCaption>The Handcrafted Scraper(s)</TableCaption>
          <TableCaption>More Coming Soon!</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Org</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-left">The URL (Gists)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">MHTCET</TableCell>
              <TableCell>State Cut Offs</TableCell>
              <TableCell className="text-left hover:underline"><a href="/scrapers/mht-cet">click here</a></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </section>
      </main>
    </div>
  );
};

export default Scapers;