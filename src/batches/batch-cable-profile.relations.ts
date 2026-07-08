/** Shared TypeORM relations for loading a batch cable profile with session context. */
export const batchCableProfileDetailRelations = {
    plant: true,
    batch: { customer: true, plant: true },
    cable_type: true,
    otdr_device: { plant: true },
    operator: { userRole: true, plant: true },
    customer: true,
    sfg_stage: true,
    wavelength_testing: true,
    physical_params: { vernier: true },
    cable_profile: {
        wavelength_configs: { cable_wavelength: true },
        cable_type: true,
    },
} as const;

/** List/detail without nested cable_profile wavelength configs. */
export const batchCableProfileListRelations = {
    plant: true,
    batch: { customer: true, plant: true },
    cable_type: true,
    otdr_device: { plant: true },
    operator: { userRole: true, plant: true },
    customer: true,
    sfg_stage: true,
    wavelength_testing: true,
    physical_params: { vernier: true },
    cable_profile: true,
} as const;
