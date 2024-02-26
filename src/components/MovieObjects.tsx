import { Box, Pagination, Tab, Tabs } from '@mui/material';
import './MovieObjects.scss';
import { useAppSelector } from '../store/hooks';
import { selectBluray } from '../store/bluray';
import { useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table';
import { Command } from '../types/bluray';
import { boolAffirm } from '../util';

const MovieObjects = () => {
    const { movieObjects } = useAppSelector(selectBluray);
    const [mobjIdx, setMobjIdx] = useState(0);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const columnHelper = createColumnHelper<Command>();
    const table = useReactTable({
        state: { pagination },
        columns: [
            columnHelper.group({
                header: 'Values',
                columns: [
                    columnHelper.group({
                        header: 'Hexadecimal',
                        columns: [
                            columnHelper.accessor('instructionHex', {
                                cell: info => info.getValue(),
                                header: () => <span>Instruction</span>,
                            }),
                            columnHelper.accessor('destinationHex', {
                                cell: info => info.getValue(),
                                header: () => <span>Destination</span>,
                            }),
                            columnHelper.accessor('sourceHex', {
                                cell: info => info.getValue(),
                                header: () => <span>Source</span>,
                            }),
                        ],
                    }),
                    columnHelper.group({
                        header: 'Decimal',
                        columns: [
                            columnHelper.accessor('instructionValue', {
                                cell: info => info.getValue(),
                                header: () => <span>Instruction</span>,
                            }),
                            columnHelper.accessor('destination', {
                                cell: info => info.getValue(),
                                header: () => <span>Destination</span>,
                            }),
                            columnHelper.accessor('source', {
                                cell: info => info.getValue(),
                                header: () => <span>Source</span>,
                            }),
                        ],
                    }),
                ],
            }),
            columnHelper.group({
                header: 'Instruction',
                columns: [
                    columnHelper.group({
                        header: 'Group',
                        columns: [
                            columnHelper.accessor('instruction.operandCount', {
                                cell: info => info.getValue(),
                                header: () => <span title='Operand Count'>OC</span>,
                            }),
                            columnHelper.accessor('instruction.group', {
                                cell: info => info.getValue(),
                                header: () => <span title='Group'>G</span>,
                            }),
                            columnHelper.accessor('instruction.subGroup', {
                                cell: info => info.getValue(),
                                header: () => <span title='Sub Group'>SG</span>,
                            }),
                        ],
                    }),
                    columnHelper.group({
                        header: 'Options',
                        columns: [
                            columnHelper.accessor('instruction.setOption', {
                                cell: info => info.getValue(),
                                header: () => <span title='Set Option'>SO</span>,
                            }),
                            columnHelper.accessor('instruction.branchOption', {
                                cell: info => info.getValue(),
                                header: () => <span title='Branch Option'>BO</span>,
                            }),
                            columnHelper.accessor('instruction.compareOption', {
                                cell: info => info.getValue(),
                                header: () => <span title='Compare Option'>CO</span>,
                            }),
                        ],
                    }),
                    columnHelper.group({
                        header: 'Reserved',
                        columns: [
                            columnHelper.accessor('instruction.reserved1', {
                                cell: info => info.getValue(),
                                header: () => <span title='Reserved 1'>R1</span>,
                            }),
                            columnHelper.accessor('instruction.reserved2', {
                                cell: info => info.getValue(),
                                header: () => <span title='Reserved 2'>R2</span>,
                            }),
                            columnHelper.accessor('instruction.reserved3', {
                                cell: info => info.getValue(),
                                header: () => <span title='Reserved 3'>R3</span>,
                            }),
                        ],
                    }),
                    columnHelper.group({
                        header: 'iFlag Operands',
                        columns: [
                            columnHelper.accessor('instruction.iFlagOperand1', {
                                cell: info => info.getValue(),
                                header: () => <span title='iFlag Operand 1'>i1</span>,
                            }),
                            columnHelper.accessor('instruction.iFlagOperand2', {
                                cell: info => info.getValue(),
                                header: () => <span title='iFlag Operand 2'>i2</span>,
                            }),
                        ],
                    }),
                ],
            }),
        ],
        data: movieObjects.length ? movieObjects[mobjIdx].commands : [],
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        autoResetPageIndex: true
    });

    if (!movieObjects.length) return null;

    return (
        <Box sx={{ flex: 1 }} className='movie-objects'>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={mobjIdx} onChange={(_, val) => {
                    setMobjIdx(val);
                    setPagination(prev => ({ ...prev, pageIndex: 0 }));
                }}>
                    { movieObjects.map((_, i) => 
                    <Tab key={`tab_${i}`} label={`Object ${i + 1}`} />) }
                </Tabs>
            </Box>
            <Box sx={{ m: 3, display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                <Pagination 
                    sx={{ mt: 3 }}
                    color='primary'
                    count={table.getPageCount()} page={pagination.pageIndex + 1} 
                    onChange={(_, p) => setPagination(prev => ({ ...prev, pageIndex: p - 1 }))}
                />
                <Box className='mobj-mask'>
                    <h2>Menu Call Mask</h2>
                    <p>{boolAffirm(movieObjects[mobjIdx].menuCallMask)}</p>
                </Box>
                <Box className='mobj-mask'>
                    <h2>Resume Intention Flag</h2>
                    <p>{boolAffirm(movieObjects[mobjIdx].resumeIntentionFlag)}</p>
                </Box>
                <Box className='mobj-mask'>
                    <h2>Title Search Mask</h2>
                    <p>{boolAffirm(movieObjects[mobjIdx].titleSearchMask)}</p>
                </Box>
            </Box>
            <Box sx={{ p: 3, overflow: 'auto' }}>
                <table>
                    <thead>
                    { table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            { headerGroup.headers.map(header => (
                            <th key={header.id} colSpan={header.colSpan}>
                            { header.isPlaceholder || !header.column.getIsVisible()
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                            ) }
                            </th>
                            ))}
                        </tr>
                    )) }
                    </thead>
                    <tbody>
                        { table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            { row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                            )) }
                        </tr>
                        )) }
                    </tbody>
                </table>
            </Box>
        </Box>
    );
}

export default MovieObjects;