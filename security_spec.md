# Security Specification for SomFX Store

## Data Invariants
1. A **User** profile must correspond to the authenticated user's ID.
2. Only Admins can create or modify **Products**.
3. **Users** can read all **Products**.
4. **Orders** can only be created by the authenticated user for themselves.
5. **Orders** are immutable after creation (except for status changes by system/admin - though here we'll keep it simple for now).
6. **Users** can only read their own **Orders**.

## The "Dirty Dozen" Payloads (Test Cases)

1. **Identity Spoofing**: Attempt to create a user profile with a UID different from the authenticated user.
2. **Privilege Escalation**: Attempt to set `role: "admin"` on a user profile during registration.
3. **Ghost Product Injection**: A non-admin user attempting to create a product.
4. **Price Manipulation**: A non-admin user attempting to update a product's price.
5. **ID Poisoning**: Attempting to use a 1MB string as a product ID.
6. **Order Hijacking**: Attempting to read another user's order.
7. **Phantom Order**: Attempting to create an order for a different `userId`.
8. **Shadow Field Injection**: Adding `isVerified: true` to a user profile update.
9. **State Shortcutting**: Updating an order status directly from `pending` to `completed` WITHOUT a valid payment proof (simulated here as restricted update).
10. **Resource Exhaustion**: Sending a description field that is 500KB.
11. **Orphaned Order**: Creating an order for a `productId` that doesn't exist.
12. **PII Leak**: A user retrieving all user profiles (list query) without restriction.

## Test Runner (Logic Check)
The `firestore.rules` must reject all of the above.
