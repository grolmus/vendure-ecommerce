import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/vdb/components/ui/select.js';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { HumanReadableOperator } from '../human-readable-operator.js';

export interface DataTableEnumFilterProps {
    value: Record<string, any> | undefined;
    options: string[];
    onChange: (filter: Record<string, any>) => void;
}

export const ENUM_OPERATORS = ['eq', 'notEq', 'isNull'] as const;

export function DataTableEnumFilter({ value: incomingValue, options, onChange }: Readonly<DataTableEnumFilterProps>) {
    const { t } = useLingui();
    const initialOperator = incomingValue ? Object.keys(incomingValue)[0] : 'eq';
    const initialValue = incomingValue ? Object.values(incomingValue)[0] : (options[0] ?? '');
    const [operator, setOperator] = useState<string>(initialOperator ?? 'eq');
    const [value, setValue] = useState<string>((initialValue as string) ?? (options[0] ?? ''));

    useEffect(() => {
        if (operator === 'isNull') {
            onChange({ [operator]: true });
        } else {
            onChange({ [operator]: value });
        }
    }, [operator, value]);

    return (
        <div className="flex flex-col md:flex-row gap-2">
            <Select
                items={Object.fromEntries(
                    ENUM_OPERATORS.map(op => [op, <HumanReadableOperator key={op} operator={op} />]),
                )}
                value={operator}
                onValueChange={v => {
                    if (v != null) setOperator(v);
                }}
            >
                <SelectTrigger>
                    <SelectValue placeholder={t`Select operator`} />
                </SelectTrigger>
                <SelectContent>
                    {ENUM_OPERATORS.map(op => (
                        <SelectItem key={op} value={op}>
                            <HumanReadableOperator operator={op} />
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {operator !== 'isNull' && (
                <Select
                    items={Object.fromEntries(options.map(o => [o, o]))}
                    value={value}
                    onValueChange={v => {
                        if (v != null) setValue(v);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t`Select value`} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map(o => (
                            <SelectItem key={o} value={o}>
                                {o}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
