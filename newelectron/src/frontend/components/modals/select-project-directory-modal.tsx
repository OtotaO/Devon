import FolderPicker from '@/components/ui/folder-picker'
import { useState, lazy, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

import { ActorRefFrom, AnyMachineSnapshot } from 'xstate'
import { newSessionMachine } from '@/lib/services/stateMachineService/stateMachine'
import { useSafeStorage } from '@/lib/services/safeStorageService'

const Dialog = lazy(() =>
    import('@/components/ui/dialog').then(module => ({
        default: module.Dialog,
    }))
)

const DialogTrigger = lazy(() =>
    import('@/components/ui/dialog').then(module => ({
        default: module.DialogTrigger,
    }))
)

const DialogContent = lazy(() =>
    import('@/components/ui/dialog').then(module => ({
        default: module.DialogContent,
    }))
)

const SelectProjectDirectoryModal = ({
    trigger,
    openProjectModal,
    setOpenProjectModal,
    hideclose,
    header,
    sessionActorref,
    state,
    model
}: {
    trigger?: JSX.Element
    openProjectModal?: boolean
    setOpenProjectModal?: (open: boolean) => void
    hideclose?: boolean
    header?: JSX.Element
    sessionActorref: ActorRefFrom<typeof newSessionMachine>
    state: AnyMachineSnapshot
    model: string
}) => {
    const [folderPath, setFolderPath] = useState('')
    const [open, setOpen] = useState(false)
    const [page, setPage] = useState(1)

    const { getApiKey } = useSafeStorage();
    const [apiKey, setApiKey] = useState('')
    // const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Panel)

    useEffect(() => {
        getApiKey(model).then((value) => {
            if (value) {
                setApiKey(value)
            }
        })
    }, [])


    function validate() {
        return folderPath !== ''
    }

    function afterSubmit() {
        sessionActorref.send({
            type: 'session.create', payload: {
                path: folderPath,
                agentConfig: {
                    model: model,
                    api_key: apiKey
                }
            }
        })
        sessionActorref.on("session.creationComplete", () => {
            sessionActorref.send({
                type: 'session.init', payload: {
                    // path: folderPath,
                    agentConfig: {
                        model: model,
                        api_key: apiKey
                    }
                }
            })
        })
        setOpen(false)
    }

    function handleOpenChange(open: boolean) {
        setOpen(open)
        if (setOpenProjectModal) setOpenProjectModal(open)
        // if (!backendUrl) return
        // getSessions(backendUrl).then(res => setSessions(res))
    }

    useEffect(() => {
        if (openProjectModal === undefined) return
        setOpen(openProjectModal)
    }, [openProjectModal])

    return (
        <Suspense fallback={<></>}>
            {(state.matches("sessionReady") || state.matches({ setup: "sessionDoesNotExist" })) && <Dialog open={open} onOpenChange={handleOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent
                    hideclose={hideclose ? true.toString() : false.toString()}
                >
                    <div className="dark mx-8 my-4">
                        {state.matches("sessionReady") ?
                            <>
                                <ExistingSessionFound
                                    continueChat={() => {
                                        sessionActorref.send({
                                            type: 'session.init', payload: {
                                                agentConfig: {
                                                    model: model,
                                                    api_key: apiKey
                                                }
                                            }
                                        })
                                    }}
                                    newChat={() => {
                                        sessionActorref.send({ type: 'session.delete' })
                                    }}
                                />
                            </> : <></>
                        }

                        {/* {sessions?.length > 0 && page === 1 ? (
                        <ExistingSessionFound
                            sessions={sessions}
                            setPage={setPage}
                            onClick={afterSubmit}
                        />
                    ) : sessions?.length === 0 || page === 2 ? (
                       
                    ) : (
                        <></>
                    )} */}

                        {
                            state.matches({ setup: "sessionDoesNotExist" }) ?
                                <>
                                    {page !== 1 && (
                                        <button
                                            className="top-3 left-3 absolute text-primary mb-2 flex items-center p-1"
                                        //  onClick={() => setPage(1)}
                                        >
                                            <ArrowLeft size={18} className="mr-1" />
                                            {/* {'Back'} */}
                                        </button>
                                    )}
                                    {/* {header} */}
                                    <SelectProjectDirectoryComponent
                                        folderPath={folderPath}
                                        setFolderPath={setFolderPath}
                                    />
                                    <StartChatButton
                                        disabled={!validate()}
                                        onClick={afterSubmit}
                                        folderPath={folderPath}
                                    />
                                </> : <></>}
                    </div>
                </DialogContent>
            </Dialog>}
        </Suspense>
    )
}

export default SelectProjectDirectoryModal

export const SelectProjectDirectoryComponent = ({
    folderPath,
    setFolderPath,
    disabled = false,
    className,
}: {
    folderPath: string
    setFolderPath: (path: string) => void
    disabled?: boolean
    className?: string
}) => {
    return (
        <div className={`flex flex-col ${className ?? ''}`}>
            <p className="text-lg font-bold mb-4">
                Select your project directory
            </p>
            <FolderPicker
                folderPath={folderPath}
                setFolderPath={setFolderPath}
                disabled={disabled}
            />
        </div>
    )
}

export const StartChatButton = ({ onClick, disabled, folderPath }) => {

    return (
        <Button
            disabled={disabled}
            className="bg-primary text-white p-2 rounded-md mt-10 w-full"
            onClick={onClick}
        >
            Start Chat
        </Button>
    )
}

const ExistingSessionFound = ({ continueChat, newChat }) => {

    return (
        <div className="dark">
            <div>
                <p className="text-2xl font-bold">
                    Continue previous chat?
                </p>
                {/* <p className="text-md mt-2 text-neutral-400">
                        {`Previous task: "`}
                        <span className="italic">Create a snake game</span>
                        {`"`}
                    </p> */}
                <div className="flex flex-col items-center">
                    <Button
                        type="submit"
                        className="bg-primary text-white p-2 rounded-md w-full mt-7"
                        onClick={continueChat}
                    >
                        Continue
                    </Button>
                    <div className="bg-neutral-600 h-[1px] w-full mt-8 mb-1"></div>
                    <p className="text-md m-4 mb-5">Or start a new chat</p>
                    <Button
                        variant="outline"
                        className="text-[#977df5] p-2 rounded-md mt-0 w-full font-bold"
                        onClick={newChat}
                    >
                        New Chat
                    </Button>
                </div>
            </div>
        </div>
    )
}
