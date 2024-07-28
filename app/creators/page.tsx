import React from 'react';
import Augillion from 'next/font/local';

const augillion = Augillion({
    src: '../../public/Augillion.otf',
    display: 'swap',
});

const CreatorPage: React.FC = () => {
    return (
        <div className='text-center mt-40 min-h-screen'>
            <div className={augillion.className}>
                <h1 className='text-7xl font-augillion text-orange-400'>The Brain behind the site</h1>
                </div>
                <div className='mt-4'>
                    <a href='https://github.com/kewonit' className='mr-1 hover:underline'>github.com/kewonit</a>
            </div>
        </div>
    );
};

export default CreatorPage;