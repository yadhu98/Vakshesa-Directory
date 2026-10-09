/**
 * Users created before membership review was introduced have no status stored.
 * Treat only that legacy absence as approved; explicit Pending/Rejected (or
 * any unknown non-empty status) must continue to fail approval checks.
 */
export const hasApprovedMembership = (user: any): boolean =>
  !!user && (user.membershipStatus == null || user.membershipStatus === 'Approved');
