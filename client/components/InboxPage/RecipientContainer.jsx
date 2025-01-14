const RecipientContainer = ({ recipients, handleRecipientClick }) => {
    return (
        <div className='custom-scrollbar w-2/12 h-full'>
            {recipients.map((recipient, index) => (
                <div
                    key={index}
                    className='p-1 pl-4 text-xs hover:bg-neutral-200 hover:text-black odd:bg-neutral-800 even:bg-neutral-700 cursor-default'
                    onClick={() =>
                        handleRecipientClick(
                            recipient.uid,
                            recipient.account_id
                        )
                    }
                >
                    {recipient.recipient}
                </div>
            ))}
        </div>
    );
};

export default RecipientContainer;