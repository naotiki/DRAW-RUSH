import {IconButton} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import {Link} from "@mui/icons-material";
import React, {useState} from "react";
import {useAppSelector} from "../app/hooks";

export default function RoomStatus() {
    const roomId=useAppSelector(state => state.roomManager.room?.roomId)

    const [isCopied, setIsCopied] = useState(false);
    const [isUrlCopied, setIsUrlCopied] = useState(false);
    const Checked =  () => {
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    };
    const CheckedUrl =  () => {
        setIsUrlCopied(true);
        setTimeout(() => {
            setIsUrlCopied(false);
        }, 1000);
    };
    return (
        <div>
            <span>
                この部屋のID: {roomId}
                <IconButton
                    aria-label='copy'
                    onClick={() => {
                        navigator.clipboard.writeText(roomId!).then(() => Checked());
                    }}
                > {' '}
                    {!isCopied ? <ContentCopyIcon/> : <CheckIcon/>}
                </IconButton>
                <IconButton
                    aria-label='copyLink'
                    onClick={() => {
                        const shareUrl = window.location.origin + "?roomId=" + roomId!
                        navigator.clipboard.writeText(shareUrl).then(() => CheckedUrl());
                    }}
                >
                    {' '}
                    {!isUrlCopied ?
                        <Link/> :
                        <CheckIcon/>
                    }
                </IconButton>
            </span>
        </div>
    )


}
