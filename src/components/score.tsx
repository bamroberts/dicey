import { testScore } from '../lib/scoringFunctions';
import { useStoreState } from '../store/hooks';

const Score = () => {
    const roll = useStoreState(state => state.game.roll);
    const turn = useStoreState(state => state.game.turn);
    const setScore = useStoreState(state => state.game.setScore);
    const getScore = useStoreState(state => state.game.getScore);
    if(!turn) return null;

    //const onClick = score === null ? () => setScore(field, score) : null;
    return (
        <div className="score">
            {Object.entries(testScore).map(([key, value]) => {
                const score = getScore(key);
                const hasScore = score !== null;
                const calc = value(roll.map(i=>i?.value ?? 0));
                const onClick = !hasScore ? () => setScore(key, calc) : null;


                return <div className={`${!!hasScore && 'bg-gray-500'}` onClick={onClick}>{key}: {score ?? calc}</div>
            })}

            {/* <div className="score__title">{title}</div>
            <button className="score__score" onClick={onClick}>{`${score}`}</button> */}
        </div>
    )
};

export default Score;