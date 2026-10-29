import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Field,
  FieldComment,
  GovernmentNgosLocation,
  InsuranceProperty,
  WorkspaceMemberSummary,
} from "./account.js";
import type { OrganizationData } from "./organizations.js";
import type { Role } from "./roles.js";

const FIELD_COLUMNS = "id, workspace_id, name, latitude, longitude, created_by, created_at";
const PROPERTY_COLUMNS =
  "id, workspace_id, policy_number, property_address, latitude, longitude, created_by, created_at";
const LOCATION_COLUMNS = "id, workspace_id, label, latitude, longitude, created_by, created_at";
const COMMENT_COLUMNS = "id, field_id, user_id, body, created_at, updated_at";

/**
 * `OrganizationData` against Supabase. The client is the service-role one,
 * which bypasses row-level security — so the organisation filter in this
 * file IS the tenant boundary. Every query below carries
 * `organization_id = <this organisation>`; writes carry it on the write
 * itself, never as a separate "check, then write" step.
 */
export class SupabaseOrganizationData implements OrganizationData {
  constructor(
    private readonly client: SupabaseClient,
    readonly organizationId: string,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Agriculture fields                                                  */
  /* ------------------------------------------------------------------ */

  async listFields(workspaceId: string): Promise<Field[]> {
    const { data, error } = await this.client
      .from("fields")
      .select(FIELD_COLUMNS)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to load fields for ${workspaceId}: ${error.message}`);
    }
    return (data ?? []).map(rowToField);
  }

  async createField(field: {
    workspaceId: string;
    name: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<Field> {
    const { data, error } = await this.client
      .from("fields")
      .insert({
        organization_id: this.organizationId,
        workspace_id: field.workspaceId,
        name: field.name,
        latitude: field.latitude,
        longitude: field.longitude,
        created_by: field.createdBy,
      })
      .select(FIELD_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(`Failed to create field in ${field.workspaceId}: ${error?.message}`);
    }
    return rowToField(data);
  }

  async updateField(
    fieldId: string,
    updates: { name?: string; latitude?: number; longitude?: number },
  ): Promise<Field> {
    const patch: Record<string, string | number> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.latitude !== undefined) patch.latitude = updates.latitude;
    if (updates.longitude !== undefined) patch.longitude = updates.longitude;

    const { data, error } = await this.client
      .from("fields")
      .update(patch)
      .eq("id", fieldId)
      .eq("organization_id", this.organizationId)
      .select(FIELD_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(`Failed to update field ${fieldId}: ${error?.message ?? "not found"}`);
    }
    return rowToField(data);
  }

  async deleteField(fieldId: string): Promise<void> {
    await this.removeFromMemberScopes(fieldId);
    const { data, error } = await this.client
      .from("fields")
      .delete()
      .eq("id", fieldId)
      .eq("organization_id", this.organizationId)
      .select("id");
    if (error) {
      throw new Error(`Failed to delete field ${fieldId}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error(`Failed to delete field ${fieldId}: not found`);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Insurance properties                                                */
  /* ------------------------------------------------------------------ */

  async listProperties(workspaceId: string): Promise<InsuranceProperty[]> {
    const { data, error } = await this.client
      .from("insurance_properties")
      .select(PROPERTY_COLUMNS)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to load insured properties for ${workspaceId}: ${error.message}`);
    }
    return (data ?? []).map(rowToProperty);
  }

  async createProperty(property: {
    workspaceId: string;
    policyNumber: string;
    propertyAddress: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<InsuranceProperty> {
    const { data, error } = await this.client
      .from("insurance_properties")
      .insert({
        organization_id: this.organizationId,
        workspace_id: property.workspaceId,
        policy_number: property.policyNumber,
        property_address: property.propertyAddress,
        latitude: property.latitude,
        longitude: property.longitude,
        created_by: property.createdBy,
      })
      .select(PROPERTY_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to create insured property in ${property.workspaceId}: ${error?.message}`,
      );
    }
    return rowToProperty(data);
  }

  async updateProperty(
    propertyId: string,
    updates: {
      policyNumber?: string;
      propertyAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<InsuranceProperty> {
    const patch: Record<string, string | number> = {};
    if (updates.policyNumber !== undefined) patch.policy_number = updates.policyNumber;
    if (updates.propertyAddress !== undefined) patch.property_address = updates.propertyAddress;
    if (updates.latitude !== undefined) patch.latitude = updates.latitude;
    if (updates.longitude !== undefined) patch.longitude = updates.longitude;

    const { data, error } = await this.client
      .from("insurance_properties")
      .update(patch)
      .eq("id", propertyId)
      .eq("organization_id", this.organizationId)
      .select(PROPERTY_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to update insured property ${propertyId}: ${error?.message ?? "not found"}`,
      );
    }
    return rowToProperty(data);
  }

  async deleteProperty(propertyId: string): Promise<void> {
    await this.removeFromMemberScopes(propertyId);
    const { data, error } = await this.client
      .from("insurance_properties")
      .delete()
      .eq("id", propertyId)
      .eq("organization_id", this.organizationId)
      .select("id");
    if (error) {
      throw new Error(`Failed to delete insured property ${propertyId}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error(`Failed to delete insured property ${propertyId}: not found`);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Government & NGOs monitored locations                               */
  /* ------------------------------------------------------------------ */

  async listLocations(workspaceId: string): Promise<GovernmentNgosLocation[]> {
    const { data, error } = await this.client
      .from("government_ngos_locations")
      .select(LOCATION_COLUMNS)
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to load monitored locations for ${workspaceId}: ${error.message}`);
    }
    return (data ?? []).map(rowToLocation);
  }

  async createLocation(location: {
    workspaceId: string;
    label: string;
    latitude: number;
    longitude: number;
    createdBy: string;
  }): Promise<GovernmentNgosLocation> {
    const { data, error } = await this.client
      .from("government_ngos_locations")
      .insert({
        organization_id: this.organizationId,
        workspace_id: location.workspaceId,
        label: location.label,
        latitude: location.latitude,
        longitude: location.longitude,
        created_by: location.createdBy,
      })
      .select(LOCATION_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to create monitored location in ${location.workspaceId}: ${error?.message}`,
      );
    }
    return rowToLocation(data);
  }

  async updateLocation(
    locationId: string,
    updates: { label?: string; latitude?: number; longitude?: number },
  ): Promise<GovernmentNgosLocation> {
    const patch: Record<string, string | number> = {};
    if (updates.label !== undefined) patch.label = updates.label;
    if (updates.latitude !== undefined) patch.latitude = updates.latitude;
    if (updates.longitude !== undefined) patch.longitude = updates.longitude;

    const { data, error } = await this.client
      .from("government_ngos_locations")
      .update(patch)
      .eq("id", locationId)
      .eq("organization_id", this.organizationId)
      .select(LOCATION_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to update monitored location ${locationId}: ${error?.message ?? "not found"}`,
      );
    }
    return rowToLocation(data);
  }

  async deleteLocation(locationId: string): Promise<void> {
    await this.removeFromMemberScopes(locationId);
    const { data, error } = await this.client
      .from("government_ngos_locations")
      .delete()
      .eq("id", locationId)
      .eq("organization_id", this.organizationId)
      .select("id");
    if (error) {
      throw new Error(`Failed to delete monitored location ${locationId}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      throw new Error(`Failed to delete monitored location ${locationId}: not found`);
    }
  }

  async countSavedItems(): Promise<number> {
    const counts = await Promise.all(
      ["fields", "insurance_properties", "government_ngos_locations"].map(async (table) => {
        const { count, error } = await this.client
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("organization_id", this.organizationId);
        if (error) {
          throw new Error(`Failed to count saved items in ${table}: ${error.message}`);
        }
        return count ?? 0;
      }),
    );
    return counts.reduce((a, b) => a + b, 0);
  }

  /**
   * A member's `scoped_resource_ids` is a plain id array, not a foreign
   * key, so deleting an item leaves a dangling id behind unless it is
   * removed here. Fetch-then-write rather than one computed update: the
   * Supabase JS client sets literal values, not SQL expressions. Confined to
   * this organisation's members.
   */
  private async removeFromMemberScopes(resourceId: string): Promise<void> {
    const { data: affected, error: fetchError } = await this.client
      .from("workspace_members")
      .select("workspace_id, user_id, scoped_resource_ids")
      .eq("organization_id", this.organizationId)
      .contains("scoped_resource_ids", [resourceId]);
    if (fetchError) {
      throw new Error(
        `Failed to check for memberships scoped to ${resourceId}: ${fetchError.message}`,
      );
    }
    for (const membership of affected ?? []) {
      const updatedScope = (membership.scoped_resource_ids ?? []).filter(
        (id: string) => id !== resourceId,
      );
      const { error: updateError } = await this.client
        .from("workspace_members")
        .update({ scoped_resource_ids: updatedScope })
        .eq("organization_id", this.organizationId)
        .eq("workspace_id", membership.workspace_id)
        .eq("user_id", membership.user_id);
      if (updateError) {
        throw new Error(
          `Failed to remove dangling reference to ${resourceId} from membership ${membership.user_id}: ${updateError.message}`,
        );
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Comments on fields                                                  */
  /* ------------------------------------------------------------------ */

  /** Is this field one of this organisation's? */
  private async fieldIsMine(fieldId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("fields")
      .select("id")
      .eq("id", fieldId)
      .eq("organization_id", this.organizationId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to check field ${fieldId}: ${error.message}`);
    }
    return Boolean(data);
  }

  async listFieldComments(fieldId: string): Promise<FieldComment[]> {
    if (!(await this.fieldIsMine(fieldId))) return [];

    const { data: comments, error: commentsError } = await this.client
      .from("field_comments")
      .select(COMMENT_COLUMNS)
      .eq("field_id", fieldId)
      .order("created_at", { ascending: true });
    if (commentsError) {
      throw new Error(`Failed to load comments for field ${fieldId}: ${commentsError.message}`);
    }
    if (!comments || comments.length === 0) {
      return [];
    }

    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles, error: profilesError } = await this.client
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);
    if (profilesError) {
      throw new Error(
        `Failed to load profiles for field ${fieldId} comments: ${profilesError.message}`,
      );
    }
    const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return comments.map((c) => {
      const profile = profileById.get(c.user_id);
      return commentFromRow(c, profile?.email, profile?.display_name);
    });
  }

  async createFieldComment(comment: {
    fieldId: string;
    userId: string;
    body: string;
  }): Promise<FieldComment> {
    if (!(await this.fieldIsMine(comment.fieldId))) {
      throw new Error(`Failed to create comment on field ${comment.fieldId}: field not found`);
    }
    const { data, error } = await this.client
      .from("field_comments")
      .insert({ field_id: comment.fieldId, user_id: comment.userId, body: comment.body })
      .select(COMMENT_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(`Failed to create comment on field ${comment.fieldId}: ${error?.message}`);
    }
    const { data: profile } = await this.client
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", comment.userId)
      .maybeSingle();
    return commentFromRow(data, profile?.email, profile?.display_name);
  }

  /**
   * The comment's field must be in this organisation AND the requester must
   * be the author. "No such comment", "not yours" and "not in your
   * organisation" are deliberately indistinguishable to the caller.
   */
  private async myOwnCommentExists(commentId: string, requestingUserId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("field_comments")
      .select("field_id")
      .eq("id", commentId)
      .eq("user_id", requestingUserId)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to look up comment ${commentId}: ${error.message}`);
    }
    return Boolean(data) && (await this.fieldIsMine(data!.field_id));
  }

  async updateFieldComment(
    commentId: string,
    requestingUserId: string,
    body: string,
  ): Promise<FieldComment> {
    const notAllowed = `Failed to update comment ${commentId}: not found, or requester is not the author.`;
    if (!(await this.myOwnCommentExists(commentId, requestingUserId))) {
      throw new Error(notAllowed);
    }
    const { data, error } = await this.client
      .from("field_comments")
      .update({ body, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("user_id", requestingUserId)
      .select(COMMENT_COLUMNS)
      .single();
    if (error || !data) {
      throw new Error(notAllowed);
    }
    const { data: profile } = await this.client
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", data.user_id)
      .maybeSingle();
    return commentFromRow(data, profile?.email, profile?.display_name);
  }

  async deleteFieldComment(commentId: string, requestingUserId: string): Promise<void> {
    const notAllowed = `Failed to delete comment ${commentId}: not found, or requester is not the author.`;
    if (!(await this.myOwnCommentExists(commentId, requestingUserId))) {
      throw new Error(notAllowed);
    }
    const { data, error } = await this.client
      .from("field_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", requestingUserId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to delete comment ${commentId}: ${error.message}`);
    }
    if (!data) {
      throw new Error(notAllowed);
    }
  }

  /* ------------------------------------------------------------------ */
  /* People                                                              */
  /* ------------------------------------------------------------------ */

  async listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberSummary[]> {
    const { data: org, error: orgError } = await this.client
      .from("organizations")
      .select("owner_id")
      .eq("id", this.organizationId)
      .single();
    if (orgError || !org) {
      throw new Error(
        `Failed to load organisation ${this.organizationId}: ${orgError?.message ?? "not found"}`,
      );
    }
    const ownerId: string = org.owner_id;

    const { data: members, error: membersError } = await this.client
      .from("workspace_members")
      .select("user_id, role, scoped_resource_ids")
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", workspaceId);
    if (membersError) {
      throw new Error(`Failed to load members for ${workspaceId}: ${membersError.message}`);
    }

    // The owner is admin_owner everywhere without needing a row — list them
    // anyway, once, with nothing that could suggest they can be demoted.
    const others = (members ?? []).filter((m) => m.user_id !== ownerId);
    const userIds = [ownerId, ...others.map((m) => m.user_id)];

    const { data: profiles, error: profilesError } = await this.client
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);
    if (profilesError) {
      throw new Error(
        `Failed to load profiles for ${workspaceId} members: ${profilesError.message}`,
      );
    }
    const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const summary = (
      userId: string,
      role: Role,
      scoped: string[] | null,
      isOwner: boolean,
    ): WorkspaceMemberSummary => {
      const profile = profileById.get(userId);
      return {
        userId,
        email: profile?.email ?? "(no profile found)",
        displayName: profile?.display_name ?? null,
        role,
        scopedResourceIds: scoped ?? undefined,
        ...(isOwner ? { isOrganizationOwner: true } : {}),
      };
    };

    return [
      summary(ownerId, "admin_owner", null, true),
      ...others.map((m) => summary(m.user_id, m.role as Role, m.scoped_resource_ids, false)),
    ];
  }

  async addMember(membership: {
    workspaceId: string;
    userId: string;
    role: Role;
    scopedResourceIds?: string[];
  }): Promise<void> {
    const { error } = await this.client.from("workspace_members").upsert(
      {
        organization_id: this.organizationId,
        workspace_id: membership.workspaceId,
        user_id: membership.userId,
        role: membership.role,
        scoped_resource_ids: membership.scopedResourceIds ?? null,
      },
      { onConflict: "workspace_id,user_id" },
    );
    if (error) {
      throw new Error(
        `Failed to add ${membership.userId} to ${membership.workspaceId}: ${error.message}`,
      );
    }
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const members = await this.listWorkspaceMembers(workspaceId);
    const target = members.find((m) => m.userId === userId);
    if (!target) {
      // Already gone — deleting a non-existent membership is not an error
      // a caller needs to handle specially.
      return;
    }
    if (target.isOrganizationOwner) {
      throw new Error("The organisation's owner can't be removed.");
    }
    const otherAdmins = members.filter((m) => m.userId !== userId && m.role === "admin_owner");
    if (target.role === "admin_owner" && otherAdmins.length === 0) {
      throw new Error(
        `Cannot remove ${userId}: they are the last admin_owner in workspace ${workspaceId}.`,
      );
    }

    const { error } = await this.client
      .from("workspace_members")
      .delete()
      .eq("organization_id", this.organizationId)
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to remove member ${userId} from ${workspaceId}: ${error.message}`);
    }

    // Someone left with no role anywhere has no reason to hold a seat.
    const { count, error: remainingError } = await this.client
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", this.organizationId)
      .eq("user_id", userId);
    if (remainingError) {
      throw new Error(`Failed to check ${userId}'s remaining roles: ${remainingError.message}`);
    }
    if ((count ?? 0) === 0) {
      const { error: leaveError } = await this.client
        .from("organization_members")
        .delete()
        .eq("organization_id", this.organizationId)
        .eq("user_id", userId)
        .eq("role", "member");
      if (leaveError) {
        throw new Error(`Failed to free ${userId}'s seat: ${leaveError.message}`);
      }
    }
  }

  async countMembers(): Promise<number> {
    const { count, error } = await this.client
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", this.organizationId);
    if (error) {
      throw new Error(`Failed to count organisation members: ${error.message}`);
    }
    return count ?? 0;
  }
}

/* -------------------------------------------------------------------- */
/* Row mapping                                                           */
/* -------------------------------------------------------------------- */

/** Row shapes as PostgREST returns them (only the columns the mappers read). */
interface ItemRow {
  id: string;
  workspace_id: string;
  latitude: number;
  longitude: number;
  created_by: string | null;
  created_at: string;
}
interface FieldRow extends ItemRow {
  name: string;
}
interface PropertyRow extends ItemRow {
  policy_number: string;
  property_address: string;
}
interface LocationRow extends ItemRow {
  label: string;
}
interface CommentRow {
  id: string;
  field_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function rowToField(row: FieldRow): Field {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function rowToProperty(row: PropertyRow): InsuranceProperty {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    policyNumber: row.policy_number,
    propertyAddress: row.property_address,
    latitude: row.latitude,
    longitude: row.longitude,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function rowToLocation(row: LocationRow): GovernmentNgosLocation {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    label: row.label,
    latitude: row.latitude,
    longitude: row.longitude,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function commentFromRow(
  row: CommentRow,
  email: string | undefined,
  displayName: string | null | undefined,
): FieldComment {
  return {
    id: row.id,
    fieldId: row.field_id,
    userId: row.user_id,
    email: email ?? "(no profile found)",
    displayName: displayName ?? null,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
