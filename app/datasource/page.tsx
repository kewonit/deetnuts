"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
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

const Datasource = () => {
  {/* 
  useEffect(() => {
    gsap.from(".fruit-image", {
      opacity: 100,
      duration: 1,
      delay: 0.5,
      stagger: 0.2,
      ease: "power2.out",
    });
    gsap.to(".fruit-image img", {
      y: "random(-70, 70)",
      duration: 5,
      ease: "none",
      yoyo: true,
      repeat: -1,
    });
  }, []);
*/}
  return (
    <div>
      <main>
      {/* 
        <section className="section" id="section1">
          <div className="fruit-images block justify-center items-center md:flex relative py-64">
            <div className="fruit-image mx-auto md:mx-5 z-0">
              <img
                src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720795017/deetnuts/MHT-CET_logo_wxbnlw.png"
                alt="pear-image"
                className="h-48 md:h-36 lg:h-48 mx-auto"
              />
            </div>
            <div className="fruit-image mx-auto md:mx-5 z-0">
              <img
                src="https://www.yudiz.com/codepen/fruity/pear-two.png"
                alt="pear-image"
                className="h-60 md:h-48 lg:h-60 mx-auto"
              />
            </div>
            <h1 className="text-8xl md:text-8xl lg:text-9xl z-10 font-bold absolute text-center w-full">
              Data <br/> Source
            </h1>
            <div className="fruit-image mx-auto md:mx-5 z-0">
              <img
                src="https://www.yudiz.com/codepen/fruity/pear-three.png"
                alt="pear-image"
                className="h-44 md:h-32 lg:h-44 mx-auto"
              />
            </div>
            <div className="fruit-image mx-auto md:mx-5 z-0">
              <img
                src="https://www.yudiz.com/codepen/fruity/pear-four.png"
                alt="pear-image"
                className="h-56 md:h-40 lg:h-56 mx-auto"
              />
            </div>
          </div>
        </section>
      */}
        <section>
          <div className="container mx-auto mt-28 py-10">
            <div className={augillion.className}>
              <h1 className="text-9xl text-center text-orange-400">
                Data Source
              </h1>
            </div>
          </div>
        </section>
        <section className="container max-w-5xl pb-20">
        <Table>
          <TableCaption>All the data sources used across the webapp!</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Organisation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="min-w-40">Year</TableHead>
              <TableHead className="text-left">The URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">MHTCET State</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2022-23</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://fe2023.mahacet.org/2022/2022ENGG_CAP1_CutOff.pdf">https://fe2023.mahacet.org/2022/2022ENGG_CAP1_CutOff.pdf</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">MHTCET All India</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2022-23, Round 1</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://fe2023.mahacet.org/2022/2022ENGG_CAP1_AI_CutOff.pdf">https://fe2023.mahacet.org/2022/2022ENGG_CAP1_AI_CutOff.pdf</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">MHTCET All India</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2022-23, Round 2</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://fe2023.mahacet.org/2022/2022ENGG_CAP2_AI_CutOff.pdf">https://fe2023.mahacet.org/2022/2022ENGG_CAP2_AI_CutOff.pdf</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">MHTCET All India</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2022-23, Round 3</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://fe2023.mahacet.org/2022/2022ENGG_CAP3_AI_CutOff.pdf">https://fe2023.mahacet.org/2022/2022ENGG_CAP3_AI_CutOff.pdf</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">JOSAA</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2024, All Rounds</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx">https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">BITS</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2023, All Rounds</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://www.bitsadmission.com/bitsat/2023/BITSAT-2023_Cut-off_Scores.pdf">https://www.bitsadmission.com/bitsat/2023/BITSAT-2023_Cut-off_Scores.pdf</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">BITS</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2022, All Rounds</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://www.bitsadmission.com/bitsat/2022/BITSAT-2022_Cut-off_Scores.pdf">https://www.bitsadmission.com/bitsat/2022/BITSAT-2022_Cut-off_Scores.pdf</a></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">BITS</TableCell>
              <TableCell>Cut Offs</TableCell>
              <TableCell>2021, All Rounds</TableCell>
              <TableCell className="text-left hover:underline"><a href="https://www.bitsadmission.com/bitsat/2021/BITSAT-2021_Cut-off_Scores.pdf">https://www.bitsadmission.com/bitsat/2021/BITSAT-2021_Cut-off_Scores.pdf</a></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        </section>
      </main>
    </div>
  );
};

export default Datasource;