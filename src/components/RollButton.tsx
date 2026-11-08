import { useStoreActions, useStoreState } from '../store/hooks';

const RollButton = () => {
    const canRoll = useStoreState(state => state.game.canRoll);
    const roll = useStoreActions(actions => actions.game.rollDice);
    if(canRoll) {
        return <button className='bg-yellow-500 p-2 rounded w-full' onClick={roll} disabled={!canRoll}>Roll</button>;
    }
    return <button className='bg-gray-500 p-2 rounded w-full' disabled={!canRoll}>Pick you score</button>;
    }

    export default RollButton;
