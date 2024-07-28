import React from 'react';
import GistEmbed from './GistEmbed';
import Link from 'next/link';

const GistPage: React.FC = () => {
  return (
    <div className='container max-w-5xl pt-48'>
      <Link
        href="/scrapers"
        className="relative pb-8 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>{" "}
        Back
      </Link>
      <h1 className='text-2xl text-bold text-orange-500 pb-8'>MHTCET State Level Cutoffs PDF Scraper</h1>
      
      <h2 className='text-xl pb-2'>Lets get started with the cooking recipe</h2>
      <p>Step 1 : to_scrape_the_pdf_and_convert_it_to_a_text_file.py </p>
      <div className='pb-16'>
        <GistEmbed  gistId="kewonit/ec03a2d9558a10f582560c12c4f41695" />
      </div>
      <p>Step 2 : to_scrape_the_pdf_and_convert_it_to_a_text_file.py </p>
      
      <div className='pb-16'>
        <GistEmbed  gistId="kewonit/0f6bc2885ec9bb71403fffd98290090f" />
      </div>
      
      <p>Step 3 : convert_the_txt_file_2txt_to_csv_3csv.py </p>
      
      <div className='pb-16'>
        <GistEmbed  gistId="kewonit/b4594bdc85d342ed965f42ac69f71ee1" />
      </div>

      <p>Step 4 : to_identify_missing_rows.py </p>
      
      <div className='pb-16'>
        <GistEmbed  gistId="kewonit/4f856e23e93ee4808ff58ff538d5004e" />
      </div>
      
    </div>
  );
};

export default GistPage;