import React, {useCallback, useEffect, useLayoutEffect, useRef, useState,} from 'react';
import {useCookies} from 'react-cookie';
import {firestore, db, storage} from '../firebase';
import {ref, push, set, serverTimestamp, onValue, off, onChildAdded} from 'firebase/database';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    deleteDoc,
    getDocs,
    deleteField
} from 'firebase/firestore';
import {
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Typography
} from '@mui/material';
import {Lock, LockOpen, PlayCircleOutline, Send} from '@mui/icons-material';
import DrawZone, {DrawZoneRef} from './DrawZone';
import {ref as storageRef, uploadString, getDownloadURL} from 'firebase/storage';
import {getRandomOdai} from '../odaiLoader'
import './../test.css'
import getParam from '../getParam'
import {DocumentReference} from "@firebase/firestore"
import firebase from "firebase/compat";
import Unsubscribe = firebase.Unsubscribe;
import JoinForm from "./JoinForm";
import RoomStatus from "./RoomStatus";
import {useCacheState} from "../app/hooks";
import {useResettableState, useResetter} from "../app/resetter";
import {AnswerData} from "./AnswersTable";
import {GameProgress} from "../app/slices/gameManager";



export const Room = () => {
    const r=useResetter<1|2>()
    const chatscrollRef = useRef<HTMLDivElement>(null);
    const allRoomRef = collection(firestore, 'rooms');
    //呼び出せる関数はDrawZone.jsxのL14らへんに定義してあります。
    const drawZoneRef = useRef<DrawZoneRef>();
    const [getGameState, setGameState, stateGameState] = useCacheState<GameProgress|undefined>(undefined);
    const [getPainter, setPainter] = useCacheState('');
    const [isJoined, setIsJoined] = useState(false);
    const [roomName, setroomName] = useState('');
    const roomId = useRef('');
    const userId = useRef('');
    const [messages, setMessages] = useState('');
    const [sendMessage, setSendMessage] = useState('');
    const [userName, setUserName] = useState('');
    const [cookie, setCookie, removeCookie] = useCookies();
    const [userDictionary, setUserDictionary] = useState<Map<string, string>>(new Map());
    const firestoreListenersRef = useRef<Unsubscribe[]>([]);
    const [imgUrl, setImgUrl,resetImgUrl] = useResettableState('',r,[1]);
    const [ansLocked, setAnsLocked] = useState(false);
    const [sentAnswer, setSentAnswer] = useState(false);
    const [answer, setAnswer] = useState('');

    const [answerDatas, setAnswerDatas] = useState<AnswerData[]>([]);
    const [odai, setOdai] = useState('');
    const [isCompositionend, setIsCompositionend] = useState(false);

    const roomRef = useRef<DocumentReference>();
    const isPainter =
        getPainter() === userId.current && getPainter() !== '';
    const SetRoomID = (value: string) => {
        roomId.current = value;
        setCookie('roomId', value);
    };
    const SetUserId = (value: string) => {
        userId.current = value;
        setCookie('userId', value);
    };
    useEffect(() => {
        //Cookieの管理 Cookieがあれば入り直す
        if (cookie.userId && cookie.roomId) {
            roomId.current = cookie.roomId;
            userId.current = cookie.userId;
            Join();
        } else {
            setroomName(getParam("roomId", null) ?? "")
        }
    }, []);
    const Clean = () => {
        resetImgUrl()
        setAnsLocked(false);
        setSentAnswer(false);
        setAnswer('');
        setAnswerDatas([]);
        setOdai('')

    }

    //ゲームの進行状態を監視
    useEffect(() => {
        console.log(getGameState());
        switch (getGameState()) {
            case GameProgress.WAIT_MORE_MEMBER: {
                break;
            }
            case GameProgress.WAIT_START: {
                //キレイキレイ
                Clean();
                setOdai(getRandomOdai())

                break;
            }
            case GameProgress.DRAW: {
                break;
            }
            case GameProgress.CHAT: {
                /*getBlob().then((blob) => {
                    const url = window.URL || window.webkitURL
url.createObjectURL(blob)
                });*/
                getDownloadURL(storageRef(
                    storage,
                    roomId.current + '.jpg'
                ))
                    .then((url) => {
                        const xhr = new XMLHttpRequest();
                        xhr.responseType = 'blob';
                        xhr.onload = (event) => {
                            const blob = xhr.response;
                        };
                        xhr.open('GET', url);
                        xhr.send();
                        setImgUrl(url);
                    })
                    .catch((error) => {
                        console.error(error)
                        // Handle any errors
                    });
                break;
            }
            case GameProgress.CHECK_ANSWER: {
                break;
            }
            case GameProgress.RESULT: {
                if (isPainter) {

                } else {
                    //正解データを同期
                    getDocs(collection(roomRef.current!, "members")).then((querySnapshot) => {
                        let tmp_answerDatas: AnswerData[] = [];
                        querySnapshot.forEach((doc) => {
                            if (getPainter() !== doc.id) {
                                const data = doc.data()
                                tmp_answerDatas.push({
                                    answer: data.answer,
                                    userId: doc.id,
                                    isCorrect: data.isCorrect
                                });
                                updateDoc(doc.ref, {
                                    answer: deleteField(),
                                    userId: deleteField(),
                                    isCorrect: deleteField()
                                });
                            }
                        });
                        setAnswerDatas(tmp_answerDatas);

                    })
                }
                break;
            }
            case GameProgress.END: {
                break;
            }
            default:
                break;
        }
    }, [stateGameState]);

    const handleSubmit = async (e: React.MouseEvent) => {
        e.preventDefault();
        const messageRef = push(ref(db, 'rooms/' + roomId.current + '/messages/'), {
            userId: userId.current,
            msg: sendMessage,
            timeStamp: serverTimestamp(),
        });
        setSendMessage('');
    };

    //日本語チェック
    const jaRegexp = /^[\u30a0-\u30ff\u3040-\u309f\u3005-\u3006\u30e0-\u9fcf]+$/

    //変換時のEnter対策
    const handleSubmitKey = async (e: React.KeyboardEvent) => {
        e.preventDefault();
        if (sendMessage.trim() === '') return
        if (sendMessage.match(jaRegexp) && !isCompositionend) {
            return
        }
        {
            setIsCompositionend(false);
            let messageRef = push(ref(db, 'rooms/' + roomId.current + '/messages/'), {
                userId: userId.current,
                msg: sendMessage,
                timeStamp: serverTimestamp(),
            });
            setSendMessage('');
        }
    };

    const GetUserNameById = (uid: string) => {
        return (userDictionary.get(uid) || 'Unknown太郎');
    }

    const ShowChat = () => {
        let result = [];
        useLayoutEffect(() => {
            if (chatscrollRef.current) chatscrollRef.current.scrollIntoView()
        })
        if (messages === '') return null;
        for (let [key, i] of Object.entries(messages)) {
            const info = i as unknown as { userId: string, msg: string, timeStamp: number }
            let articleClass = info.userId === userId.current ? "msg-self" : "msg-remote"
            articleClass += " msg-container"
            result.push(
                <article className={articleClass}>
                    <div className="msg-box">
                        <div className="flr">
                            <p className="msg" id="msg-0">{info.msg}</p>
                        </div>
                        <span className="timestamp"><span
                            className="username">{GetUserNameById(info.userId)}</span>-<span
                            className="posttime">{new Date(info.timeStamp).toLocaleTimeString('ja-JP')}</span></span>
                    </div>
                </article>
            );
        }

        return (<section className="chat-window">{result}
            <div ref={chatscrollRef}></div>
        </section>)

    };
    const SetGameState = async (state: GameProgress) => {
        console.log(state);
        console.log(roomRef.current);
        await updateDoc(roomRef.current!, {State: state});
        setGameState(state)
    };


    const Join = useCallback(() => {
        let createSelf = false;
        if (
            (userName === '' || roomName === '') &&
            !cookie.userId &&
            !cookie.roomId
        ) {
            alert('ルーム名かユーザー名を入力してください');
            return;
        }
        const CheckRoom = async () => {
            //Cookieから取り出す
            let rN = roomName;
            if (rN === '') {
                rN = roomId.current;
            }
            let Ref = await doc(allRoomRef, rN);
            let docSnap = await getDoc(Ref);
            if (!docSnap.exists()) {
                let Id = await CreateRoom();
                SetRoomID(Id);
                return Id;
            } else {
                const State = docSnap.data().State;
                if (
                    State === GameProgress.WAIT_MORE_MEMBER ||
                    State === GameProgress.WAIT_START || (roomId.current && userId.current)
                ) {
                    setGameState(State)
                    SetRoomID(rN);
                    return rN;
                }

                return '';
            }
        };

        const CreateRoom = async () => {
            let res = await addDoc(allRoomRef, {Name: roomName});
            SetRoomID(res.id);
            await set(ref(db, 'rooms/' + res.id), {messages: ''});
            console.log(res.id);
            createSelf = true;
            return res.id;
        };
        const SetRoom = async (roomId: string) => {
            console.log(roomId);
            roomRef.current = doc(allRoomRef, roomId);
            if (cookie.roomId === undefined || cookie.roomId === '' || cookie.userId === undefined || cookie.userId === "" || !Object.keys(cookie).length) {
                const userRef = await addDoc(collection(roomRef.current, '/members/'), {
                    name: userName,
                });
                SetUserId(userRef.id);
            }
            if (createSelf) {
                //自分が作成者ならPainterを自分に
                await updateDoc(roomRef.current, {Painter: userId.current});
                setPainter(userId.current);
            }
        };

        const JoinRoom = async () => {
            let id = await CheckRoom();
            if (id === '') {
                return '';
            }
            await SetRoom(id);
            return id;
        };

        JoinRoom().then((id) => {
            if (id === '') {
                alert('待機状態でなかったため、入れませんでした');
                return;
            }
            const roomDoc = doc(allRoomRef, id); //Not
            const q = collection(roomDoc, '/members/');


            firestoreListenersRef.current.push(
                onSnapshot(roomDoc, {
                    next: (doc) => {
                        const data = doc.data();
                        console.log(data);
                        setroomName(data!.Name);
                        setGameState(data!.State);

                        setPainter(data!.Painter);
                    },
                })
            );

            firestoreListenersRef.current.push(
                onSnapshot(q, {
                    next: (querySnapshot) => {
                        let tmp = new Map<string, string>();

                        querySnapshot.forEach((doc) => {
                            console.log(doc.id);
                            console.log(doc.data());
                            tmp.set(doc.id, doc.data()!.name as string)
                        });
                        setUserName(tmp.get(userId.current)!);
                        setUserDictionary(tmp);
                        // console.log(balloonRef);
                        // balloonRef.current.syncUsers(tmp);

                        const Alone = async () => {
                            if (getPainter() !== userId.current) {
                                await updateDoc(roomRef.current!, {
                                    Painter: userId.current,
                                }).then(() => {
                                    //setPainter(userId.userId)
                                });
                            }
                            SetGameState(GameProgress.WAIT_MORE_MEMBER);
                        };

                        const userIds = Object.keys(tmp)
                        if (userIds.length <= 1) {
                            Alone(); //独りぼっちならPainterを自分にかつ状態をWAIT_MORE_MEMBERに
                        } else {
                            console.log(getGameState())

                            if (!userIds.includes(getPainter()) && userIds[0] === userId.current) {
                                updateDoc(roomRef.current!, {
                                    Painter: userId.current,
                                }).then(() => {
                                    SetGameState(GameProgress.WAIT_START)
                                });
                            }
                            if (getPainter() === userId.current) {
                                if (getGameState() === GameProgress.WAIT_MORE_MEMBER) {
                                    SetGameState(GameProgress.WAIT_START);
                                } else if (getGameState() === GameProgress.CHAT) {
                                    if (querySnapshot.docs.every(doc => doc.data().answer || getPainter() === doc.id)) {
                                        SetGameState(GameProgress.CHECK_ANSWER).then(() => {
                                            let tmp_answerDatas: AnswerData[] = [];
                                            querySnapshot.forEach((doc) => {
                                                if (getPainter() !== doc.id) {
                                                    const data = doc.data()
                                                    tmp_answerDatas.push({
                                                        answer: data.answer,
                                                        userId: doc.id,
                                                        isCorrect: false
                                                    });
                                                }
                                            });
                                            setAnswerDatas(tmp_answerDatas);
                                        })
                                    }
                                }
                            } else if (getGameState() === GameProgress.CHAT) {
                                if (querySnapshot.docs.every(doc => doc.data().answer || getPainter() === doc.id)) {
                                    SetGameState(GameProgress.CHECK_ANSWER).then(() => {
                                        let tmp_answerDatas: AnswerData[] = [];
                                        querySnapshot.forEach((doc) => {
                                            if (getPainter() !== doc.id) {
                                                const data = doc.data()
                                                tmp_answerDatas.push({
                                                    answer: data.answer,
                                                    userId: doc.id,
                                                    isCorrect: false
                                                });
                                            }
                                        });
                                        setAnswerDatas(tmp_answerDatas);
                                    })
                                }
                            }

                        }
                    },
                })
            );
            JoinChat(id);
            setIsJoined(true);
        }).finally(() => {
        });
        const JoinChat = (id: string) => {
            const chatRef = ref(db, 'rooms/' + id + '/messages');
            onChildAdded(chatRef, (snapshot) => {
                console.log(snapshot.val());

            })
            onValue(chatRef, (snapshot) => {
                console.log(snapshot.val());
                let selfmessages = snapshot.val();
                setMessages(selfmessages);

            });
        };
    }, [roomName, userName]);
    const Left = useCallback(() => {
        firestoreListenersRef.current.forEach((l) => {
            l();
        });
        deleteDoc(
            doc(allRoomRef, roomId.current + '/members/' + userId.current)
        ).finally(() => {
            roomId.current = '';
            userId.current = '';
            setUserDictionary(new Map());
            // balloonRef.current.syncUsers({});
            setMessages('');
            setGameState(undefined);
            setroomName("");
            setUserName("");
            removeCookie('userId');
            removeCookie('roomId');
            setIsJoined(false);
            setAnsLocked(false)
            setAnswer('');
            setSentAnswer(false);
            const Ref = ref(db, 'rooms/' + roomId.current + '/messages');
            off(Ref);
        });
    }, [sentAnswer, userDictionary, userName, messages, stateGameState, roomName, isJoined, ansLocked, answer]);

    const LockAnswer = useCallback(() => {
        updateDoc(doc(collection(roomRef.current!, '/members/'), userId.current), {
            answer: answer
        }).then(() => {
            setAnsLocked(true)
            setSentAnswer(true)
        })

    }, [answer]);
    const SubmitResult = () => {
        setSentAnswer(true);
        const Async = async () => {
            for (const ans of answerDatas) {
                await updateDoc(doc(collection(roomRef.current!, '/members/'), ans.userId), {
                    isCorrect: ans.isCorrect
                })
            }
        }
        Async().then(() => {
            SetGameState(GameProgress.RESULT)
        })
    }
    const StartNewGame = useCallback(() => {
        const uids = Object.keys(userDictionary).filter(uid => uid !== getPainter())
        updateDoc(roomRef.current!, {
            Painter: uids[Math.floor(Math.random() * uids.length)]
        }).then(() => {
            SetGameState(GameProgress.WAIT_START);
        })
    }, [userDictionary])
    return (
        <div>
            <div style={{width: '50%', flex: 1, flexDirection: 'row'}}>
               <JoinForm />
                <RoomStatus/>
                {isJoined ? (
                    <>
                        <div style={{
                            width: '35%',
                            height: '100%',
                            flex: 1,
                            flexDirection: 'column',
                            position: 'fixed',
                            right: 0,
                            backgroundColor: "#2f323b",
                        }}>
                            <ShowChat></ShowChat>
                            {/* <div> */}
                            <TextField
                                label="お話しよう！"
                                style={{
                                    display: 'flex',
                                    width: '35%',
                                    position: 'fixed',
                                    bottom: 0,
                                    backgroundColor: 'white'
                                }}
                                value={sendMessage}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter') handleSubmitKey(e)
                                }}
                                onChange={(e) => {
                                    setSendMessage(e.target.value);
                                }}
                                onCompositionEnd={() => {
                                    setIsCompositionend(true)
                                }}
                                variant='filled'
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton
                                                onClick={handleSubmit}
                                                edge='end'
                                                color='primary'
                                                disabled={sendMessage.trim() === ''}
                                            >
                                                {<Send/>}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            ></TextField>
                            {/* </div> */}

                        </div>
                    </>
                ) : (
                    <></>
                )}</div>
            <div style={{width: '65%'}}>
                {isPainter && (
                    <>
                        <h3>メンバー数:{Object.keys(userDictionary).length}</h3>
                        <DrawZone
                            ref={drawZoneRef}
                            penRadius={5}
                            odai={odai}
                            onDrawEnd={(imageDataUrl) => {

                                // Data URL string
                                uploadString(storageRef(
                                    storage,
                                    roomId.current + '.jpg',
                                ), imageDataUrl, 'data_url', {cacheControl: "no-cache"}).then(
                                    (snapshot) => {

                                        SetGameState(GameProgress.CHAT);
                                    }
                                );
                            }}
                            canvasOverRay={() => {
                                return (<>
                                        <Typography

                                            variant={"h6"}>
                                            {GameProgress.WAIT_START !== stateGameState ?
                                                "メンバーが集まるまでお待ちください" :
                                                "今から3秒間の間に上のお題を描いてください。当ててもらえるように頑張って！！"
                                            }

                                        </Typography>
                                        <p>
                                            <Button variant={"contained"}
                                                    disabled={GameProgress.WAIT_START !== stateGameState}
                                                    onClick={() => {
                                                        SetGameState(GameProgress.DRAW).then(() => {
                                                            drawZoneRef.current!.start();
                                                        })
                                                    }}><PlayCircleOutline></PlayCircleOutline>ここをクリックでスタート</Button>
                                        </p></>
                                )
                            }}
                        />
                    </>
                )}
                {getGameState() === GameProgress.CHAT && imgUrl !== '' &&
                    <>

                        {!isPainter ?

                            <div style={{width: '100%', justifyContent: 'center', alignItems: 'center'}}>
                                <img className={"image"} src={imgUrl} alt={"書かれたもの"}/>
                                <TextField
                                    value={answer}
                                    onChange={(e) => {
                                        setAnswer(e.target.value);
                                    }}
                                    label={"回答"}
                                    disabled={ansLocked}
                                    variant='filled'
                                    InputProps={{
                                        endAdornment: (

                                            <InputAdornment position='end'>
                                                <IconButton
                                                    onClick={LockAnswer}
                                                    edge='end'
                                                    color='primary'
                                                    disabled={answer === '' || ansLocked}
                                                >
                                                    {ansLocked ? <Lock/> : <LockOpen/>}
                                                </IconButton>
                                            </InputAdornment>

                                        ),
                                    }}
                                ></TextField>
                            </div> : <></>}
                    </>
                }
                {(getGameState() === GameProgress.CHECK_ANSWER || getGameState() === GameProgress.RESULT) && answerDatas.length !== 0 &&
                    <>
                        <div>

                            {(!(sentAnswer && !isPainter) || isPainter) && getGameState() === GameProgress.CHECK_ANSWER ?
                                <Button variant={"contained"} onClick={SubmitResult}>結果を送信</Button> : <></>}
                            {(getGameState() === GameProgress.RESULT && isPainter) &&
                                <Button variant={"contained"} onClick={StartNewGame}>次のゲーム</Button>
                            }
                        </div>
                    </>
                }
            </div>
        </div>
    );
};

export default Room;
