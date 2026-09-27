# Google Drive backup destination

The weekly GitHub Actions job can upload the encrypted database dump to Google Drive, then verify its checksum. GitHub runs the job; the operator's computer need not stay online. The job still needs the database credentials and age public recipient configured by scripts/configure-backup.ps1. Database recovery and Storage object bytes remain subject to [OPERATIONS](OPERATIONS.md).

## Connect the operator's Drive

Create an operator-owned Google OAuth Desktop app with the Drive API enabled. Use rclone's drive.file scope so it can access only files/folders this integration creates. Authorize through the browser on the operator's computer. Use a separate private rclone.conf with a remote named drivebackup. Store client secret/access token/refresh token only in an ACL-restricted ignored local directory; never paste the JSON/config into chat or publish it.

Save that configuration as the repository Actions secret BACKUP_RCLONE_CONFIG through stdin to gh secret set; gh secret set does not support --body-file. In PowerShell, read the private file with Get-Content -Raw and pipe directly into gh secret set BACKUP_RCLONE_CONFIG --repo OWNER/REPO. Do not print the contents or put them in arguments. Set repository variable BACKUP_DRIVE_ENABLED=true only after authorization is successful. Google OAuth credentials here are for backup, separate from Supabase Google sign-in. Complete the OAuth audience configuration for durable unattended access; external apps left in Testing can have grants expire after one week. See [rclone configuration/scopes](https://rclone.org/drive/) and [own OAuth client](https://rclone.org/drive/#making-your-own-client-id).

## Upload and recovery

The runner writes the OAuth secret to an owner-only temporary file, removes it on exit, and uploads only nonempty masuk-saku-*.dump.age files to MasukSaku-Backups. It does not upload plaintext dumps, the age private identity or the server recovery key. Checksum failure fails the job. Existing different-content files are not overwritten; unrelated Drive files are not synchronized or deleted. GitHub encrypted artifact retention remains90days; Drive copies currently have no automatic deletion and consume the operator's quota.

Download the encrypted file from Drive and decrypt with the independently retained age identity during an isolated restore rehearsal. A test OAuth login or folder creation is not proof of a successful database backup. Require a successful scheduled/manual dump→encryption→upload→checksum run and a measured restore rehearsal before claiming the backup gate complete.
