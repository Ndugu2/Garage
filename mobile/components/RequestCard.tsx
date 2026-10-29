import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AssistanceRequest, UserRole } from '../services/types';
import { StatusBadge } from './StatusBadge';

interface RequestCardProps {
  request: AssistanceRequest;
  userRole?: UserRole;
  onOpenChat: (request: AssistanceRequest) => void;
  onUpdateStatus?: (requestId: number, nextStatus: 'accepted' | 'rejected' | 'completed') => void;
  onOpenReview?: (request: AssistanceRequest) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  userRole = 'driver',
  onOpenChat,
  onUpdateStatus,
  onOpenReview,
}) => {
  const router = useRouter();
  const isDriver = userRole === 'driver';
  const isMechanic = userRole === 'mechanic';

  const navigateToDetails = () => {
    router.push({
      pathname: '/request-details',
      params: { id: request.id.toString() },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.issueText}>🚨 {request.issue}</Text>
          <Text style={styles.idText}>Request #{request.id}</Text>
        </View>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.infoSection}>
        {isDriver && (
          <Text style={styles.participantText}>
            Mechanic: <Text style={styles.bold}>{request.mechanic_details?.name || `Mechanic #${request.mechanic}`}</Text>
          </Text>
        )}
        {isMechanic && (
          <Text style={styles.participantText}>
            Driver: <Text style={styles.bold}>{request.driver_name || request.driver_email || `Driver #${request.driver}`}</Text>
          </Text>
        )}

        {request.notes ? (
          <Text style={styles.notesText} numberOfLines={2}>
            "{request.notes}"
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            📍 Lat: {request.latitude.toFixed(4)}, Lon: {request.longitude.toFixed(4)}
          </Text>
          <Text style={styles.metaText}>
            {new Date(request.created_at).toLocaleDateString()} {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* Review preview if already completed and reviewed */}
      {request.review && (
        <View style={styles.reviewBox}>
          <Text style={styles.reviewRating}>
            ⭐ {request.review.rating}/5 from driver
          </Text>
          {request.review.comment ? (
            <Text style={styles.reviewComment}>"{request.review.comment}"</Text>
          ) : null}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.detailsBtn}
          onPress={navigateToDetails}
        >
          <Text style={styles.detailsBtnText}>🔍 Full Details</Text>
        </TouchableOpacity>

        {/* Chat / Messages Button */}
        {request.status !== 'rejected' && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.chatBtn}
            onPress={() => onOpenChat(request)}
          >
            <Text style={styles.chatBtnText}>💬 Messages</Text>
          </TouchableOpacity>
        )}

        {/* Mechanic Actions */}
        {isMechanic && request.status === 'pending' && onUpdateStatus && (
          <>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.statusBtn, styles.acceptBtn]}
              onPress={() => onUpdateStatus(request.id, 'accepted')}
            >
              <Text style={styles.acceptBtnText}>✓ Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.statusBtn, styles.rejectBtn]}
              onPress={() => onUpdateStatus(request.id, 'rejected')}
            >
              <Text style={styles.rejectBtnText}>✕ Decline</Text>
            </TouchableOpacity>
          </>
        )}

        {isMechanic && request.status === 'accepted' && onUpdateStatus && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.statusBtn, styles.completeBtn]}
            onPress={() => onUpdateStatus(request.id, 'completed')}
          >
            <Text style={styles.completeBtnText}>✓ Mark Completed</Text>
          </TouchableOpacity>
        )}

        {/* Driver Review Action */}
        {isDriver && request.status === 'completed' && !request.review && onOpenReview && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.reviewBtn}
            onPress={() => onOpenReview(request)}
          >
            <Text style={styles.reviewBtnText}>⭐ Leave Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  issueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  idText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 10,
  },
  participantText: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  reviewBox: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  reviewComment: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  detailsBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  completeBtn: {
    backgroundColor: '#2563EB',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  reviewBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
