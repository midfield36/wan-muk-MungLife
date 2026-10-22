# MungLife Security Specification & Invariants

## 1. Data Invariants
1. **User Identity & Isolation**: A user can only write their own user profile (`users/{userId}` where `request.auth.uid == userId`). Non-owners cannot read private user profiles.
2. **Dog Ownership**: A dog profile can only be created by an authenticated user matching `ownerId`. Updates and deletes are restricted to the owner (`resource.data.ownerId == request.auth.uid`) or admin (`midfield36@gmail.com`).
3. **Health Records Privacy**: Medical records contain sensitive pet health data. Only the pet owner (`resource.data.ownerId == request.auth.uid`) can create, read, update, or delete health records.
4. **Walk Logs Privacy**: Only the owner of the walk record can read, update, or delete their walk history.
5. **Missing Dogs Public Safety**: Anyone can read missing dog alerts so the public can help find them. Only the owner or admin can update status (e.g., mark as 'found') or delete the alert. Sighting reports can be created by any authenticated user, but cannot be modified once sent.
6. **Community Integrity**: Community posts and place reviews are publicly readable. Only authenticated authors can create posts or reviews. Authors can update content or delete their own posts/reviews. Admin can moderate any post/review/report.
7. **Abuse Reporting**: Any authenticated user can submit a report for moderation. Only admins can read or update reports.
8. **Immutability of IDs & Timestamps**: `createdAt`, `ownerId`, and `authorId` cannot be mutated on update.
9. **String Boundary Limits**: All text inputs must adhere to `maxLength` boundaries defined in the blueprint to prevent Denial-of-Wallet attacks.

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

1. **Ghost Admin Escalation**: Attacker attempts to update user document with `"role": "admin"`.
2. **Dog Hijacking**: Attacker sends dog update where `ownerId` is swapped to an arbitrary attacker UID.
3. **Health Record Snooping**: Unauthenticated or cross-user GET request to `/healthRecords/{recordId}` belonging to another user.
4. **Walk Spoofing**: Attacker attempts to inject walk record with another user's `ownerId`.
5. **Oversized Payload Bomb**: Attacker attempts to write a 1MB string into `Dog.name` or `CommunityPost.title`.
6. **Immutable Field Tampering**: Attacker updates `CommunityPost` while altering original `authorId` or `createdAt`.
7. **Unverified Missing Dog Deletion**: Cross-user DELETE request to `/missingDogs/{id}` by someone who is not the owner or admin.
8. **Public Report Snooping**: Non-admin user tries to list or read records from `/reports`.
9. **Fake Verified Place Injection**: Non-admin user attempts to directly create or update `/places/{placeId}` with `"isVerified": true`.
10. **Review Impersonation**: Attacker creates a review with `userId` set to another user.
11. **Checklist Theft**: Cross-user read or update to `/travelChecklists/{id}`.
12. **Comment Forgery**: Writing a comment with `authorId` spoofed.

---

## 3. Test Verification
All operations above are asserted to be rejected with `PERMISSION_DENIED` under the rules defined in `firestore.rules`.
