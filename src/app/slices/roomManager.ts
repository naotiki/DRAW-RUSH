import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface RoomState {
    room?:Room
}
type Room={
    roomId:string
    roomName:string
    userId:string


}
const initialState: RoomState = {
    room:undefined
}

export const roomSlicer = createSlice({
    name: 'roomManager',
    initialState,
    reducers: {

        removeRoom(state){
          state.room=undefined
        },
        setRoom: (state, action: PayloadAction<Room>) => {
            state.room = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const {  setRoom, removeRoom } = roomSlicer.actions

export default roomSlicer.reducer