import { useStoreActions, useStoreState } from '../store/hooks';
import Die from './die';

const Dice = () => {
    const dice = useStoreState((state) => state.game.roll);
    const held = useStoreState(state => state.game.hold);
    const setHold = useStoreActions(actions => actions.game.setHold);
    console.log(dice);
    console.log(held);
    return (
        <div className='grid grid-cols-5 gap-3'>
        {dice.map((die, index) => (
            <Die key={index} value={die?.value || 0} onClick={() => setHold(index)} hold={held[index]} />
        ))}
        </div>
    );
} 

export default Dice;