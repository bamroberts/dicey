// store/index.ts

import {createStore} from 'easy-peasy';
import model, {StoreModel} from './model';

const store = createStore<StoreModel>(model);

export default store;