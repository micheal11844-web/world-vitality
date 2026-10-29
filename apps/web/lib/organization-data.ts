import {
  emptyOrganizationData,
  type OrganizationData,
  type WorkspaceMembership,
} from "@world-vitality/identity-service";
import { getAccountService } from "./account";

/**
 * The handle for reading and writing saved items (fields, insured
 * properties, monitored locations, comments) and the people in the
 * organisation — confined to the organisation the membership belongs to.
 *
 * A membership with no `organizationId` (no session, no organisation, a
 * member with no role in this workspace, or a failed lookup) gets the
 * empty handle: reads are empty and writes throw. That is deliberate — see
 * `get-workspace-membership.ts`.
 *
 * Server-side only, like `getAccountService()`.
 */
export function getOrganizationData(
  membership: Pick<WorkspaceMembership, "organizationId">,
): OrganizationData {
  return membership.organizationId
    ? getAccountService().forOrganization(membership.organizationId)
    : emptyOrganizationData();
}
