# Documentation

This folder is the maintained documentation set for the DEETNUTS application, data pipelines, and platform operations.

## Core References

- [ARCHITECTURE.md](./ARCHITECTURE.md): System layout, runtime boundaries, data domains, and deployment model
- [JOSAA_IMPLEMENTATION.md](./JOSAA_IMPLEMENTATION.md): JoSAA module structure, data model, and ingestion notes
- [ROUND_SUPPORT_IMPLEMENTATION.md](./ROUND_SUPPORT_IMPLEMENTATION.md): Current year and round behavior for MHT-CET state cutoffs
- [VERCEL_BEST_PRACTICES.md](./VERCEL_BEST_PRACTICES.md): Platform, performance, and reliability conventions used in the repo

## Operational Guides

- [scripts-readme.md](./scripts-readme.md): Script inventory, execution patterns, and known maintenance drift
- [BATCH_UPLOAD_README.md](./BATCH_UPLOAD_README.md): MHT-CET state cutoff batch uploader notes
- [COLLEGE_UPLOADER_README.md](./COLLEGE_UPLOADER_README.md): College master data uploader notes
- [SEAT_MATRIX_UPLOADER_README.md](./SEAT_MATRIX_UPLOADER_README.md): Seat matrix uploader notes

## Historical Notes

- [AUTO_CANCELLATION_FIX.md](./AUTO_CANCELLATION_FIX.md): Why the batch scripts still disable auto-cancellation and use unique request keys

## Feature-Local Documentation

- [../app/predictions/README.md](../app/predictions/README.md): Prediction dataset explorer
- [../app/mht-cet/all-india-cutoffs/README.md](../app/mht-cet/all-india-cutoffs/README.md): MHT-CET all-India cutoff module
- [../app/mht-cet/all-india-cutoffs/TEST_GUIDE.md](../app/mht-cet/all-india-cutoffs/TEST_GUIDE.md): Smoke-test checklist for the all-India module

## Suggested Reading Order

1. Start with the repository [README](../README.md).
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system context.
3. Use the feature-specific or uploader guides only for the area you are touching.
