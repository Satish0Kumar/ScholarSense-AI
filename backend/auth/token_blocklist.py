"""JWT token revocation support for ScholarSense."""

revoked_tokens = set()


def revoke_token(jti: str):
    """Add a token identifier to the revoked token set."""
    if jti:
        revoked_tokens.add(jti)


def is_token_revoked(jwt_header, jwt_payload):
    """Check whether a token has been revoked."""
    jti = jwt_payload.get('jti')
    return jti in revoked_tokens
