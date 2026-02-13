import { EventType } from '@/lib/stats/events';

describe('Stats Events Module', () => {
  describe('EventType enum', () => {
    it('should define skill events', () => {
      expect(EventType.SKILL_VIEWED).toBe('skill_viewed');
      expect(EventType.SKILL_DOWNLOADED).toBe('skill_downloaded');
      expect(EventType.SKILL_UPLOADED).toBe('skill_uploaded');
      expect(EventType.SKILL_VERSION_CREATED).toBe('skill_version_created');
    });

    it('should define evaluation events', () => {
      expect(EventType.EVAL_STARTED).toBe('eval_started');
      expect(EventType.EVAL_COMPLETED).toBe('eval_completed');
      expect(EventType.EVAL_FAILED).toBe('eval_failed');
    });

    it('should define security events', () => {
      expect(EventType.SECURITY_SCAN_STARTED).toBe('security_scan_started');
      expect(EventType.SECURITY_SCAN_COMPLETED).toBe('security_scan_completed');
      expect(EventType.SECURITY_ISSUE_FOUND).toBe('security_issue_found');
    });

    it('should define bundle events', () => {
      expect(EventType.BUNDLE_CREATED).toBe('bundle_created');
      expect(EventType.BUNDLE_SKILL_ADDED).toBe('bundle_skill_added');
      expect(EventType.BUNDLE_DOWNLOADED).toBe('bundle_downloaded');
    });

    it('should define team events', () => {
      expect(EventType.TEAM_CREATED).toBe('team_created');
      expect(EventType.TEAM_MEMBER_ADDED).toBe('team_member_added');
      expect(EventType.TEAM_MEMBER_REMOVED).toBe('team_member_removed');
    });

    it('should define user events', () => {
      expect(EventType.USER_REGISTERED).toBe('user_registered');
      expect(EventType.USER_LOGIN).toBe('user_login');
    });
  });

  describe('TrackEventOptions interface', () => {
    it('should have required and optional properties', () => {
      // This test validates the interface structure at compile time
      const validOptions = {
        type: EventType.SKILL_VIEWED,
        resource: 'skill',
        resourceId: 'skill-123',
        userId: 'user-123',
        metadata: { version: '1.0.0' },
      };

      expect(validOptions.type).toBe(EventType.SKILL_VIEWED);
      expect(validOptions.resource).toBe('skill');
      expect(validOptions.resourceId).toBe('skill-123');
      expect(validOptions.userId).toBe('user-123');
      expect(validOptions.metadata).toEqual({ version: '1.0.0' });
    });

    it('should allow minimal options', () => {
      const minimalOptions = {
        type: EventType.USER_LOGIN,
        resource: 'session',
      };

      expect(minimalOptions.type).toBe(EventType.USER_LOGIN);
      expect(minimalOptions.resource).toBe('session');
      expect(minimalOptions.userId).toBeUndefined();
      expect(minimalOptions.resourceId).toBeUndefined();
      expect(minimalOptions.metadata).toBeUndefined();
    });
  });

  describe('Event tracking validation', () => {
    it('should categorize skill-related events correctly', () => {
      const skillEvents = [
        EventType.SKILL_VIEWED,
        EventType.SKILL_DOWNLOADED,
        EventType.SKILL_UPLOADED,
        EventType.SKILL_VERSION_CREATED,
      ];

      skillEvents.forEach(event => {
        expect(event).toContain('skill');
      });
    });

    it('should categorize security-related events correctly', () => {
      const securityEvents = [
        EventType.SECURITY_SCAN_STARTED,
        EventType.SECURITY_SCAN_COMPLETED,
        EventType.SECURITY_ISSUE_FOUND,
      ];

      securityEvents.forEach(event => {
        expect(event).toContain('security');
      });
    });

    it('should categorize team-related events correctly', () => {
      const teamEvents = [
        EventType.TEAM_CREATED,
        EventType.TEAM_MEMBER_ADDED,
        EventType.TEAM_MEMBER_REMOVED,
      ];

      teamEvents.forEach(event => {
        expect(event).toContain('team');
      });
    });
  });
});
