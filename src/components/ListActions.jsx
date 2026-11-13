import { useAuth } from "../auth/AuthContext";

export default function ListActions({
    module,
    onView,
    onEdit,
    onDelete,
    onActivate,

    viewLabel = "View",
    editLabel = "Edit",
    deleteLabel = "Deactivate",
    activateLabel = "Activate",

    deleteDisabled = false,
    activateDisabled = false,
    viewDisabled = false,
    editDisabled = false,
    editButtonClassName = "",
    deleteButtonClassName = "",
    deleteIconClassName = "bi bi-trash3",
}) {
    const { can } = useAuth();
    const allow = (action) => !module || can(module, action);
    return (
        <div className="list-actions" onClick={(event) => event.stopPropagation()}>
            {onView && allow("view") && (
                <button
                    type="button"
                    className="list-action-btn"
                    disabled={viewDisabled}
                    onClick={(event) => {
                        event.stopPropagation();
                        onView(event);
                    }}
                    aria-label={viewLabel}
                >
                    <i className="bi bi-eye View-btn list-action-view-icon" aria-hidden="true" />
                </button>
            )}

            {onEdit && allow("update") && (
                <button
                    type="button"
                    className={`list-action-btn ${editButtonClassName}`.trim()}
                    disabled={editDisabled}
                    onClick={(event) => {
                        event.stopPropagation();
                        onEdit(event);
                    }}
                    aria-label={editLabel}
                >
                    <i className="bi bi-pencil list-action-edit-icon" aria-hidden="true" />
                </button>
            )}

            {onActivate && allow("update") && (
                <button
                    type="button"
                    className="list-action-btn text-success"
                    disabled={activateDisabled}
                    onClick={(event) => {
                        event.stopPropagation();
                        onActivate(event);
                    }}
                    aria-label={activateLabel}
                >
                    <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                </button>
            )}

            {onDelete && allow("delete") && (
                <button
                    type="button"
                    className={`list-action-btn text-danger ${deleteButtonClassName}`.trim()}
                    disabled={deleteDisabled}
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete(event);
                    }}
                    aria-label={deleteLabel}
                >
                    <i className={`${deleteIconClassName} list-action-delete-icon`} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
