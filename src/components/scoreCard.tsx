import { useStoreActions } from "easy-peasy"



const ScoreCard = (props: any) => {
    return (
        <div className="score-card">
            <div className="score-card__title">{props.title}</div>
            <div className="score-card__score">{props.score}</div>
            <div>
                <h2>Tops</h2>
                <ul>
                    {props.tops.map((top: any) => {
                        return <div>{top.name}</div>
                    })}
                </ul>
            </div>
        </div>
    )
}

type ScoreProps = {
    title: string;
    field: string;
    score: number;
    setScore: any;
};

const Score = ({title, field, score, setScore}: ScoreProps) => {
    const onClick = score === null ? () => setScore(field, score) : null;
    return (
        <div className="score">
            <div className="score__title">{title}</div>
            <button className="score__score" onClick={onClick}>{`${score}`}</button>
        </div>
    )
}

export default ScoreCard;