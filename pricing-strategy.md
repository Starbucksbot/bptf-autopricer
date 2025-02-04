# Updated Pricing Strategy

The pricing strategy has been simplified by:

1. Removing dependencies on `excludedListingDescriptions` and `blockedAttributes` configurations
2. Implementing a more efficient snapshot queue system that:
   - Batches snapshot insertions (100 at a time)
   - Processes queue every 5 seconds
   - Handles failures gracefully with automatic retries
   - Reduces database load through batched operations
3. Uses only essential listing data:
   - SKU
   - Keys/metal prices
   - Timestamp
   - Steam ID
   - Deletion status
   - Automation status
   - Blacklist status
   - SCM price

The strategy now focuses on core pricing data without the complexity of managing excluded listing descriptions or blocked attributes. This simplification makes the system more maintainable and performant while still maintaining accurate pricing capabilities.