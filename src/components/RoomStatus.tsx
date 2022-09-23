import {IconButton} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import {Link} from "@mui/icons-material";
import React, {useState} from "react";

export default function RoomStatus(props: {
    roomId: string
}) {

    const [isCopied, setIsCopied] = useState(false);
    const [isUrlCopied, setIsUrlCopied] = useState(false);
    const Checked = async () => {
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1000);
    };
    const CheckedUrl = async () => {
        setIsUrlCopied(true);
        setTimeout(() => {
            setIsUrlCopied(false);
        }, 1000);
    };
    return (
        <div>
            <span>
                この部屋のID: {}
                <IconButton
                    aria-label='copy'
                    onClick={() => {
                        navigator.clipboard.writeText(props.roomId).then(() => Checked());
                    }}
                > {' '}
                    {!isCopied ? <ContentCopyIcon/> : <CheckIcon/>}
                </IconButton>
                <IconButton
                    aria-label='copyLink'
                    onClick={() => {
                        const shareUrl = window.location.origin + "?roomId=" + props.roomId
                        navigator.clipboard.writeText(shareUrl).then(r => CheckedUrl());

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
