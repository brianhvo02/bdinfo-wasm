import { Box, Tab, Tabs } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import './MovieObjects.scss';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { WorkerProps } from '../types/props';
import { selectBluray } from '../store/bluray';
import { useState } from 'react';

const movieObjectColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID' },
    { field: 'instructionValue', headerName: 'Instruction' },
    { field: 'destination', headerName: 'Destination' },
    { field: 'source', headerName: 'Source' },
    { field: 'instructionHex', headerName: 'Instruction (Hex)' },
    { field: 'destinationHex', headerName: 'Destination (Hex)' },
    { field: 'sourceHex', headerName: 'Source (Hex)' },
    { field: 'group', headerName: 'Group',
        valueGetter: params => params.row.instruction.group
    },
    { field: 'subGroup', headerName: 'Sub Group',
        valueGetter: params => params.row.instruction.subGroup
    },
    { field: 'operandCount', headerName: 'Operand Count',
        valueGetter: params => params.row.instruction.operandCount
    },
    { field: 'setOption', headerName: 'Set Option',
        valueGetter: params => params.row.instruction.setOption
    },
    { field: 'compareOption', headerName: 'Compare Option',
        valueGetter: params => params.row.instruction.compareOption
    },
    { field: 'branchOption', headerName: 'Branch Option',
        valueGetter: params => params.row.instruction.branchOption
    },
    { field: 'iFlagOperand1', headerName: 'I Flag Operand 1',
        valueGetter: params => params.row.instruction.iFlagOperand1
    },
    { field: 'iFlagOperand2', headerName: 'I Flag Operand 2',
        valueGetter: params => params.row.instruction.iFlagOperand2
    },
    { field: 'reserved1', headerName: 'Reserved 1',
        valueGetter: params => params.row.instruction.reserved1
    },
    { field: 'reserved2', headerName: 'Reserved 2',
        valueGetter: params => params.row.instruction.reserved2
    },
    { field: 'reserved3', headerName: 'Reserved 3',
        valueGetter: params => params.row.instruction.reserved3
    },
];

const MovieObjects = () => {
    const { movieObjects } = useAppSelector(selectBluray);
    const [mobjIdx, setMobjIdx] = useState(0);

    if (!movieObjects.length) return null

    return (
        <Box sx={{ width: '100%' }} className='movie-objects'>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={mobjIdx} onChange={(_, val) => setMobjIdx(val)}>
                    { movieObjects.map((_, i) => 
                    <Tab key={`tab_${i}`} label={`Object ${i + 1}`} />) }
                </Tabs>
            </Box>
            <Box sx={{ p: 3, height: '100%' }}>
                <DataGrid
                    rows={movieObjects[mobjIdx].commands}
                    columns={movieObjectColumns}
                    disableRowSelectionOnClick
                    autoPageSize
                />
            </Box>
        </Box>
    );
}

export default MovieObjects;