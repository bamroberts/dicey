import React from "react";

const dotLayouts = [
    [], // 0
    [5], // 1
    [1, 9], // 2
    [1, 5, 9], // 3
    [1, 3, 7, 9], // 4
    [1, 3, 5, 7, 9], // 5
    [1, 3, 4, 6, 7, 9], // 6
];


const allDots = Array(9).fill(0).map((_, i) => i + 1);

const Die = ({ value, onClick, hold}: { value: number, onClick: ()=>void, hold:boolean}) => {

    const layout = dotLayouts[value] ?? [];

    const dots = allDots.map((position) => layout.find((on) => on === position) ? <div key={position} className='bg-black rounded-full' /> : <div key={position} />);

   const className = hold ? 'border-red-500 -translate-y-6' : 'border-cyan-500';

    return (
        <div onClick={onClick} className={`flex justify-center items-center rounded-xl overflow-hidden border-2 ${className}`}>
            <div className="grid grid-rows-3 grid-cols-3 gap-1 p-3 w-24 h-24 bg-white  ">
                {dots}
            </div>
        </div>
    );
}


export default React.memo(Die);