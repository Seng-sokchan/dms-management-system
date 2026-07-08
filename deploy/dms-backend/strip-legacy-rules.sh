#!/bin/sh
# Strip legacy configurable-rules files that crash when role_menus was dropped.
# Safe no-op when the tree is already clean.
set -eu

ROOT="${1:-.}"

rm -f \
  "$ROOT/src/repositories/roleMenus.js" \
  "$ROOT/src/repositories/menus.js" \
  "$ROOT/src/repositories/roleAccess.js" \
  "$ROOT/src/repositories/roleClients.js" \
  "$ROOT/src/repositories/roleSocketChannels.js" \
  "$ROOT/src/repositories/roleStatusPermissions.js" \
  "$ROOT/src/repositories/statusTransitions.js" \
  "$ROOT/src/services/roleMenuService.js" \
  "$ROOT/src/controllers/roleMenuController.js" \
  "$ROOT/src/routes/groups/admin/roleMenuRoutes.js" \
  "$ROOT/src/validators/roleMenu.validator.js"

READ_VIEWS="$ROOT/src/repositories/sql/readViews.js"
if [ -f "$READ_VIEWS" ]; then
  # Remove legacy view constants if an old copy was synced.
  tmp=$(mktemp)
  # shellcheck disable=SC2016
  sed -E \
    -e '/ROLE_MENUS[[:space:]]*:/d' \
    -e '/[[:space:]]MENUS[[:space:]]*:[[:space:]]*"v_menus"/d' \
    -e '/ROLE_CLIENTS[[:space:]]*:/d' \
    -e '/ROLE_STATUS_PERMISSIONS[[:space:]]*:/d' \
    -e '/ROLE_SOCKET_CHANNELS[[:space:]]*:/d' \
    -e '/STATUS_TRANSITIONS[[:space:]]*:/d' \
    "$READ_VIEWS" > "$tmp"
  mv "$tmp" "$READ_VIEWS"
fi

# Fail the image build if anything under src still depends on dropped tables/views.
if grep -R -E 'roleMenus|ROLE_MENUS|v_role_menus|roleMenuService|roleMenuRoutes|listRoleMenus|sp_delete_role_menus|sp_add_role_menu' \
  "$ROOT/src" >/tmp/legacy-role-menus-hits.txt 2>/dev/null; then
  echo "ERROR: legacy role_menus references remain under src:" >&2
  cat /tmp/legacy-role-menus-hits.txt >&2
  exit 1
fi

echo "Legacy role_menus cleanup OK"
