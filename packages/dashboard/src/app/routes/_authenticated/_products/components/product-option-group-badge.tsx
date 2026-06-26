import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/vdb/components/ui/alert-dialog.js';
import { Badge } from '@/vdb/components/ui/badge.js';
import { ConfirmationDialog } from '@/vdb/components/shared/confirmation-dialog.js';
import { api } from '@/vdb/graphql/api.js';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { removeOptionGroupFromProductDocument } from '../products.graphql.js';

interface ProductOptionGroupBadgeProps {
    id: string;
    name: string;
    productId: string;
    /**
     * When provided, the badge renders a remove control that detaches the option
     * group from the product (issue #4703 — a wrongly-added option group could
     * not be removed from the product detail page). Called after a successful
     * removal so the parent can refresh.
     */
    onRemoved?: () => void;
}

export function ProductOptionGroupBadge({ id, name, productId, onRemoved }: ProductOptionGroupBadgeProps) {
    const { t } = useLingui();
    const [forceOpen, setForceOpen] = useState(false);

    const removeMutation = useMutation({
        mutationFn: api.mutate(removeOptionGroupFromProductDocument),
        onSuccess: (result: any) => {
            const removeResult = result?.removeOptionGroupFromProduct;
            if (
                removeResult &&
                '__typename' in removeResult &&
                removeResult.__typename === 'ProductOptionInUseError'
            ) {
                setForceOpen(true);
                return;
            }
            toast.success(t`Option group removed`);
            onRemoved?.();
        },
        onError: error => {
            toast.error(t`Failed to remove option group`, {
                description: error instanceof Error ? error.message : t`Unknown error`,
            });
        },
    });

    const forceRemoveMutation = useMutation({
        mutationFn: api.mutate(removeOptionGroupFromProductDocument),
        onSuccess: () => {
            setForceOpen(false);
            toast.success(t`Option group removed`);
            onRemoved?.();
        },
        onError: error => {
            setForceOpen(false);
            toast.error(t`Failed to remove option group`, {
                description: error instanceof Error ? error.message : t`Unknown error`,
            });
        },
    });

    return (
        <>
            <Badge variant="secondary" className="text-xs">
                <span>{name}</span>
                <Link
                    to={`/option-groups/${id}`}
                    search={{ from: 'product', productId }}
                    className="ml-1.5 inline-flex"
                >
                    <Edit2 className="h-3 w-3" />
                </Link>
                {onRemoved && (
                    <ConfirmationDialog
                        title={t`Remove option group`}
                        description={t`Are you sure you want to remove this option group from the product?`}
                        onConfirm={() => removeMutation.mutate({ productId, optionGroupId: id })}
                    >
                        <button
                            type="button"
                            aria-label={t`Remove option group`}
                            disabled={removeMutation.isPending}
                            className="ml-1 inline-flex"
                        >
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                    </ConfirmationDialog>
                )}
            </Badge>
            <AlertDialog open={forceOpen} onOpenChange={setForceOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            <Trans>Force remove option group</Trans>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <Trans>
                                This option group is in use by existing variants. Force removing it may
                                affect those variants. Are you sure?
                            </Trans>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setForceOpen(false)}>
                            <Trans>Cancel</Trans>
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                forceRemoveMutation.mutate({ productId, optionGroupId: id, force: true })
                            }
                        >
                            <Trans>Force remove</Trans>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
