import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface IGameState {
    game?:Game
}
type Game={
    gameState: GameState
    painterId:string
}
export enum GameState  {
    WAIT_MORE_MEMBER= 'waitMember', //独りぼっち　さみしい
    WAIT_START= 'waitStart', //スタート待ち
    DRAW= 'draw', //お絵描き中、画像アップロード待ち
    CHAT= 'chat', //話し合い中
    CHECK_ANSWER= 'checkAnswer', //答え合わせ
    RESULT= 'result', //結果ー＞goto DRAW or END
    END= 'end', //ゲーム終了
};
const initialState: IGameState = {
    game:undefined
}

export const gameSlicer = createSlice({
    name: 'roomManager',
    initialState,
    reducers: {

        removeRoom(state){
            state.game=undefined
        },
        setRoom: (state, action: PayloadAction<Game>) => {
            state.game = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const {  setRoom, removeRoom } = gameSlicer.actions

export default gameSlicer.reducer