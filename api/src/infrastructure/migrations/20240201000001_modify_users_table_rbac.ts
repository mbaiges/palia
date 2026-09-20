import type { Knex } from 'knex';

/**
 * Modify users table for RBAC
 * Add profile_image_id and avatar_image_id columns, remove picture column
 */
export async function up(knex: Knex): Promise<void> {
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    console.log('⚠️  Users table does not exist, skipping migration');
    return;
  }

  // Check if columns already exist
  const hasProfileImageId = await knex.schema.hasColumn('users', 'profile_image_id');
  const hasAvatarImageId = await knex.schema.hasColumn('users', 'avatar_image_id');

  if (!hasProfileImageId) {
    await knex.schema.table('users', (table) => {
      table.string('profile_image_id').nullable();
      table.foreign('profile_image_id').references('image_id').inTable('images').onDelete('SET NULL');
    });
  }

  if (!hasAvatarImageId) {
    await knex.schema.table('users', (table) => {
      table.string('avatar_image_id').nullable();
      table.foreign('avatar_image_id').references('image_id').inTable('images').onDelete('SET NULL');
    });
  }

  // Migrate existing picture URLs to images table if picture column exists
  const hasPictureColumn = await knex.schema.hasColumn('users', 'picture');
  if (hasPictureColumn) {
    // Get all users with picture URLs
    const usersWithPictures = await knex('users').whereNotNull('picture').select('id', 'picture');

    for (const user of usersWithPictures) {
      if (user.picture) {
        // Create image record
        const imageId = `img-${user.id}-${Date.now()}`;
        await knex('images').insert({
          image_id: imageId,
          url: user.picture,
          created_at: new Date().toISOString(),
        });

        // Update user with profile_image_id
        await knex('users').where('id', user.id).update({
          profile_image_id: imageId,
        });
      }
    }

    // Drop picture column after migration
    await knex.schema.table('users', (table) => {
      table.dropColumn('picture');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasUsersTable = await knex.schema.hasTable('users');
  if (!hasUsersTable) {
    return;
  }

  // Re-add picture column
  const hasPictureColumn = await knex.schema.hasColumn('users', 'picture');
  if (!hasPictureColumn) {
    await knex.schema.table('users', (table) => {
      table.string('picture').nullable();
    });
  }

  // Migrate profile_image_id back to picture if it exists
  const hasProfileImageId = await knex.schema.hasColumn('users', 'profile_image_id');
  if (hasProfileImageId) {
    const usersWithProfileImages = await knex('users')
      .whereNotNull('profile_image_id')
      .select('id', 'profile_image_id');

    for (const user of usersWithProfileImages) {
      if (user.profile_image_id) {
        const image = await knex('images').where('image_id', user.profile_image_id).first();
        if (image) {
          await knex('users').where('id', user.id).update({
            picture: image.url,
          });
        }
      }
    }

    // Drop foreign key constraints and columns
    await knex.schema.table('users', (table) => {
      table.dropForeign(['profile_image_id']);
      table.dropColumn('profile_image_id');
    });
  }

  const hasAvatarImageId = await knex.schema.hasColumn('users', 'avatar_image_id');
  if (hasAvatarImageId) {
    await knex.schema.table('users', (table) => {
      table.dropForeign(['avatar_image_id']);
      table.dropColumn('avatar_image_id');
    });
  }
}

