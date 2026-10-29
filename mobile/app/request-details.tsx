import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import {
  apiGetRequest,
  apiGetRequestMessages,
  apiSendRequestMessage,
  apiSubmitReview,
  apiUpdateRequestStatus,
} from '../services/api';
import { AssistanceRequest, RequestMessage, RequestStatus } from '../services/types';

export default function RequestDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string }>();
  const requestId = params.id ? parseInt(params.id, 10) : null;

  const [request, setRequest] = useState<AssistanceRequest | null>(null);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chat message state
  const [newMessage, setNewMessage] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Review state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const isMechanic = user?.profile?.role === 'mechanic';
  const isDriver = user?.profile?.role === 'driver';

  const scrollRef = useRef<ScrollView>(null);

  const loadData = async () => {
    if (!requestId) {
      setError('No request ID provided.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [reqData, msgsData] = await Promise.all([
        apiGetRequest(requestId),
        apiGetRequestMessages(requestId).catch(() => []),
      ]);

      if (!reqData) {
        setError('Request not found or access denied.');
      } else {
        setRequest(reqData);
        setMessages(msgsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handleSendMessage = async () => {
    if (!requestId || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const msg = await apiSendRequestMessage(requestId, newMessage.trim());
      setMessages((prev: RequestMessage[]) => [...prev, msg]);
      setNewMessage('');
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (nextStatus: RequestStatus) => {
    if (!requestId) return;

    try {
      const updated = await apiUpdateRequestStatus(requestId, nextStatus);
      setRequest(updated);
      Alert.alert('Success', `Request marked as ${nextStatus}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const handleSubmitReview = async () => {
    if (!requestId) return;

    try {
      setSubmittingReview(true);
      const rev = await apiSubmitReview(requestId, reviewRating, reviewComment.trim());
      if (request) {
        setRequest({ ...request, review: rev });
      }
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Request Details" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading assistance request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppHeader title="Request Details" showBack />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Request Unavailable</Text>
          <Text style={styles.errorSubtitle}>{error || 'Could not find this request.'}</Text>
          <Button
            title="Back to All Requests"
            onPress={() => router.replace('/requests')}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title={`Request #${request.id}`} showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Status Card */}
          <View style={styles.card}>
            <View style={styles.statusHeaderRow}>
              <View>
                <Text style={styles.issueHeading}>🚨 {request.issue}</Text>
                <Text style={styles.createdAtText}>
                  Placed on {new Date(request.created_at).toLocaleDateString()} at{' '}
                  {new Date(request.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <StatusBadge status={request.status} />
            </View>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    styles.stepActive,
                  ]}
                >
                  <Text style={styles.stepCheck}>✓</Text>
                </View>
                <Text style={styles.stepLabel}>Placed</Text>
              </View>

              <View
                style={[
                  styles.stepLine,
                  (request.status === 'accepted' || request.status === 'completed') &&
                    styles.stepLineActive,
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    (request.status === 'accepted' || request.status === 'completed') &&
                      styles.stepActive,
                    request.status === 'rejected' && styles.stepRejected,
                  ]}
                >
                  <Text style={styles.stepCheck}>
                    {request.status === 'rejected' ? '✕' : request.status === 'accepted' || request.status === 'completed' ? '✓' : '2'}
                  </Text>
                </View>
                <Text style={styles.stepLabel}>
                  {request.status === 'rejected' ? 'Declined' : 'Accepted'}
                </Text>
              </View>

              <View
                style={[
                  styles.stepLine,
                  request.status === 'completed' && styles.stepLineActive,
                ]}
              />

              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    request.status === 'completed' && styles.stepActive,
                  ]}
                >
                  <Text style={styles.stepCheck}>
                    {request.status === 'completed' ? '✓' : '3'}
                  </Text>
                </View>
                <Text style={styles.stepLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Contact Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact & Location</Text>

            {isDriver && (
              <View style={styles.contactItem}>
                <View style={styles.contactLeft}>
                  <Text style={styles.contactLabel}>Assigned Mechanic</Text>
                  <Text style={styles.contactName}>
                    {request.mechanic_details?.name || `Mechanic #${request.mechanic}`}
                  </Text>
                  <Text style={styles.contactSub}>
                    📍 {request.mechanic_details?.area || 'Kampala Area'}
                  </Text>
                </View>
                {request.mechanic_details?.phone && (
                  <TouchableOpacity
                    style={styles.callIconBtn}
                    onPress={() => Linking.openURL(`tel:${request.mechanic_details?.phone}`)}
                  >
                    <Text style={styles.callIconText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {isMechanic && (
              <View style={styles.contactItem}>
                <View style={styles.contactLeft}>
                  <Text style={styles.contactLabel}>Driver Customer</Text>
                  <Text style={styles.contactName}>
                    {request.driver_name || request.driver_email || `Driver #${request.driver}`}
                  </Text>
                  <Text style={styles.contactSub}>
                    {request.driver_email ? `✉️ ${request.driver_email}` : ''}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Breakdown Location:</Text>
              <Text style={styles.infoValue}>
                {request.latitude.toFixed(4)}° N, {request.longitude.toFixed(4)}° E
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service Mode:</Text>
              <Text style={styles.infoValue}>
                {request.service_mode === 'mobile' ? '🚙 Mobile Roadside Unit' : '🏬 Garage Workshop'}
              </Text>
            </View>

            {request.notes ? (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>Driver's Description:</Text>
                <Text style={styles.notesBody}>"{request.notes}"</Text>
              </View>
            ) : null}
          </View>

          {/* Mechanic Status Action Controls */}
          {isMechanic && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Manage Request Status</Text>
              <View style={styles.actionRow}>
                {request.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.statusBtn, styles.acceptBtn]}
                      onPress={() => handleUpdateStatus('accepted')}
                    >
                      <Text style={styles.btnTextWhite}>✓ Accept Request</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.statusBtn, styles.rejectBtn]}
                      onPress={() => handleUpdateStatus('rejected')}
                    >
                      <Text style={styles.btnTextWhite}>✕ Decline</Text>
                    </TouchableOpacity>
                  </>
                )}

                {request.status === 'accepted' && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.statusBtn, styles.completeBtn]}
                    onPress={() => handleUpdateStatus('completed')}
                  >
                    <Text style={styles.btnTextWhite}>✓ Mark Job as Completed</Text>
                  </TouchableOpacity>
                )}

                {request.status === 'completed' && (
                  <Text style={styles.completedBanner}>
                    🎉 This assistance request has been completed successfully!
                  </Text>
                )}

                {request.status === 'rejected' && (
                  <Text style={styles.rejectedBanner}>
                    This request was declined.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Review & Rating Section for Drivers */}
          {isDriver && request.status === 'completed' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Service Rating & Feedback</Text>

              {request.review ? (
                <View style={styles.reviewedContainer}>
                  <View style={styles.starRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.reviewStar,
                          { color: i < request.review!.rating ? '#F59E0B' : '#E2E8F0' },
                        ]}
                      >
                        ★
                      </Text>
                    ))}
                    <Text style={styles.reviewScoreText}>({request.review.rating}/5)</Text>
                  </View>
                  {request.review.comment ? (
                    <Text style={styles.reviewedComment}>"{request.review.comment}"</Text>
                  ) : null}
                  <Text style={styles.reviewSubmittedNote}>✓ Your feedback was recorded</Text>
                </View>
              ) : (
                <View style={styles.reviewForm}>
                  <Text style={styles.reviewFormPrompt}>
                    How was the mechanic's service?
                  </Text>
                  <View style={styles.starSelectorRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewRating(star)}
                        style={styles.starBtn}
                      >
                        <Text
                          style={[
                            styles.starSelectorChar,
                            { color: star <= reviewRating ? '#F59E0B' : '#CBD5E1' },
                          ]}
                        >
                          ★
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Write a comment about their response time, expertise, or quality of work..."
                    placeholderTextColor="#94A3B8"
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={3}
                  />

                  <Button
                    title="Submit Review"
                    onPress={handleSubmitReview}
                    loading={submittingReview}
                    variant="primary"
                    style={{ marginTop: 10 }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Live In-App Chat Thread */}
          {request.status !== 'rejected' && (
            <View style={styles.card}>
              <View style={styles.chatHeader}>
                <Text style={styles.cardTitle}>Direct Messages</Text>
                <TouchableOpacity onPress={loadData} style={styles.refreshChatBtn}>
                  <Text style={styles.refreshChatText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>

              {messages.length === 0 ? (
                <View style={styles.emptyChatBox}>
                  <Text style={styles.emptyChatEmoji}>💬</Text>
                  <Text style={styles.emptyChatText}>No messages sent yet</Text>
                  <Text style={styles.emptyChatSub}>
                    Send a message to coordinate arrival time or specific landmark instructions.
                  </Text>
                </View>
              ) : (
                <View style={styles.messagesList}>
                  {messages.map((m: RequestMessage) => {
                    const isMe = m.sender === user?.id;
                    return (
                      <View
                        key={m.id}
                        style={[
                          styles.messageBubble,
                          isMe ? styles.messageBubbleMe : styles.messageBubbleThem,
                        ]}
                      >
                        <Text style={[styles.messageSender, isMe && styles.messageSenderMe]}>
                          {m.sender_name || (isMe ? 'You' : 'Partner')}
                        </Text>
                        <Text style={[styles.messageBody, isMe && styles.messageBodyMe]}>
                          {m.message}
                        </Text>
                        <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Chat Input */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#94A3B8"
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  <Text style={styles.sendBtnText}>{sendingMessage ? '...' : 'Send'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  issueHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  createdAtText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepActive: {
    backgroundColor: '#10B981',
  },
  stepRejected: {
    backgroundColor: '#EF4444',
  },
  stepCheck: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactLeft: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  contactSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  callIconBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  notesBody: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  completeBtn: {
    backgroundColor: '#2563EB',
  },
  btnTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  completedBanner: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    fontWeight: '700',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
    width: '100%',
  },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    color: '#991B1B',
    fontWeight: '700',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
    width: '100%',
  },
  reviewedContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewStar: {
    fontSize: 18,
  },
  reviewScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 6,
  },
  reviewedComment: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 6,
    fontStyle: 'italic',
  },
  reviewSubmittedNote: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 6,
  },
  reviewForm: {
    gap: 8,
  },
  reviewFormPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  starSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  starBtn: {
    padding: 4,
  },
  starSelectorChar: {
    fontSize: 28,
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshChatBtn: {
    padding: 4,
  },
  refreshChatText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '700',
  },
  emptyChatBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyChatEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  emptyChatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyChatSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 20,
  },
  messagesList: {
    gap: 8,
    marginBottom: 12,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 14,
    maxWidth: '85%',
  },
  messageBubbleMe: {
    backgroundColor: '#F97316',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  messageBubbleThem: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  messageSender: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  messageSenderMe: {
    color: '#FFEDD5',
  },
  messageBody: {
    fontSize: 13,
    color: '#0F172A',
  },
  messageBodyMe: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: '#FED7AA',
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
