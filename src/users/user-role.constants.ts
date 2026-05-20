/** Matches identifiers stored in `user_roles.identifier` (see GET /user-roles). */
export const UserRoleIdentifier = {
    PLANT_OPERATOR: 'Plant_Operator',
    QC_INSPECTOR: 'QC_Inspector',
    PLANT_SUPERVISOR: 'Plant_Supervisor',
    IT_ADMIN: 'Admin',
    CENTRAL_AUDITOR: 'Central_Auditor',
} as const;

export type UserRoleIdentifierValue =
    (typeof UserRoleIdentifier)[keyof typeof UserRoleIdentifier];
