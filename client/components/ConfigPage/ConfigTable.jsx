import React, { useState } from 'react';
import { format as dateFormatter } from 'date-fns';
import PageNavigation from './PageNavigation';
const ConfigTable = ({
    accounts,
    selectedAccounts,
    setSelectedAccounts,
    handleSelectAll,
    handleSelectAccount,
    currentPage,
    itemsPerPage,
    setCurrentPage,
}) => {
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const selectedAccountsPage = accounts.slice(
        startIndex,
        startIndex + itemsPerPage
    );
    const totalPages = Math.ceil(accounts.length / itemsPerPage);

    const areAllAccountsSelected = selectedAccountsPage.every((account) =>
        selectedAccounts.includes(account.id)
    );

    const handleClickPage = (page) => {
        setCurrentPage(page);
    };

    const handleCheckboxChange = (event, accountId, index) => {
        if (window.event.shiftKey && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const newSelectedAccounts = [...selectedAccounts];
            for (let i = start; i <= end; i++) {
                const account = selectedAccountsPage[i];
                if (!newSelectedAccounts.includes(account.id)) {
                    newSelectedAccounts.push(account.id);
                }
            }

            setSelectedAccounts(newSelectedAccounts);
        } else {
            handleSelectAccount(event, accountId);
        }
        setLastSelectedIndex(index);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp * 1000); // Convert Unix timestamp to milliseconds
        return dateFormatter(date, 'MM/dd/yyyy hh:mm:ss a');
    };

    return (
        <div className='pt-6'>
            <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
                <table className='w-full text-sm text-left text-gray-300'>
                    <thead className='text-sm bg-blue-900 text-gray-200'>
                        <tr>
                            <th scope='col' className='p-4'>
                                <div className='flex items-center'>
                                    <input
                                        id='checkbox-all-search'
                                        type='checkbox'
                                        className='w-4 h-4'
                                        onChange={handleSelectAll}
                                        checked={areAllAccountsSelected}
                                    />
                                    <label className='sr-only'>checkbox</label>
                                </div>
                            </th>
                            <th scope='col' className='px-6 py-3'>
                                Email
                            </th>
                            <th scope='col' className='px-6 py-3'>
                                Status
                            </th>
                            <th scope='col' className='px-6 py-3'>
                                Mail Amount
                            </th>
                            <th scope='col' className='px-6 py-3'>
                                Last Synced
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedAccountsPage.map((account, index) => (
                            <tr
                                key={account.id}
                                className='odd:bg-gray-800 even:bg-gray-700 border-b border-gray-700'
                            >
                                <td className='w-4 p-4'>
                                    <div className='flex items-center'>
                                        <input
                                            id={`checkbox-${account.id}`}
                                            type='checkbox'
                                            className='w-4 h-4'
                                            onChange={(event) =>
                                                handleCheckboxChange(
                                                    event,
                                                    account.id,
                                                    index
                                                )
                                            }
                                            checked={selectedAccounts.includes(
                                                account.id
                                            )}
                                        />
                                        <label className='sr-only'>
                                            checkbox
                                        </label>
                                    </div>
                                </td>
                                <td className='px-6 py-4 text-white'>
                                    {account.user}
                                </td>
                                <td className='px-6 py-4'>
                                    <div
                                        className={`w-4 h-4 rounded-full ml-3 ${
                                            account.alive === null
                                                ? 'bg-orange-500'
                                                : account.alive
                                                ? 'bg-green-500'
                                                : 'bg-red-500'
                                        }`}
                                    ></div>
                                </td>
                                <td className='px-6 py-4'>
                                    {account.amount === 0
                                        ? '0'
                                        : account.amount}
                                </td>
                                <td className='px-6 py-4'>
                                    {account.last_synced === null
                                        ? 'Never'
                                        : formatDate(account.last_synced)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PageNavigation
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                accountsLength={accounts.length}
                handleClickPage={handleClickPage}
            />
        </div>
    );
};

export default ConfigTable;
