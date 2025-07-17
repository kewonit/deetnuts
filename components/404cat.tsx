import React from 'react';
import Image from 'next/image';

const ErrorPage: React.FC = () => {
    return (
        <div>
            <h1>err while loadin deets</h1>
            <Image src="/404cat.webp" alt="404cat" />
        </div>
    );
};

export default ErrorPage;