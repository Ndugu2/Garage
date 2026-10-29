import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { RequestCard } from '../components/RequestCard';
import { useAuth } from '../hooks/useAuth';
import {
  apiGetRequestMessages,
  apiGetRequests,
  apiSendRequestMessage,
  apiSubmitReview,
  apiUpdateRequestStatus,
} from '../services/api';
import { AssistanceRequest, RequestMessage, RequestStatus } from '../services/types';

type TabFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export default function RequestsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [error, setError] = useState<string | null>(null);

  // Chat Modal State
  const [chatRequest, setChatRequest] = useState<AssistanceRequest | null>(null);
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Review Modal State
  const [reviewRequest, setReviewRequest] = useState<AssistanceRequest | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!isAuthenticated) return;
    try {
      setError(null);
      const data = await apiGetRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assistance requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
    } else if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated, authLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Status transition handler for mechanics
  const handleUpdateStatus = async (
    requestId: number,
    nextStatus: 'accepted' | 'rejected' | 'completed'
  ) => {
    try {
      const updated = await apiUpdateRequestStatus(requestId, nextStatus);
      setRequests((prev: AssistanceRequest[]) =>
        prev.map((r: AssistanceRequest) => (r.id === requestId ? { ...r, status: updated.status } : r))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update request status');
    }
  };

  // Open Chat Modal & load messages
  const handleOpenChat = async (request: AssistanceRequest) => {
    setChatRequest(request);
    setLoadingMessages(true);
    try {
      const msgs = await apiGetRequestMessages(request.id);
      setMessages(msgs);
    } catch (err) {
      console.warn('Could not load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message in Chat Modal
  const handleSendMessage = async () => {
    if (!chatRequest || !newMessageText.trim()) return;
    setSendingMessage(true);
    try {
      const sent = await apiSendRequestMessage(chatRequest.id, newMessageText.trim());
      setMessages((prev: RequestMessage[]) => [...prev, sent]);
      setNewMessageText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Open Review Modal
  const handleOpenReview = (request: AssistanceRequest) => {
    setReviewRequest(request);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!reviewRequest) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const savedReview = await apiSubmitReview(reviewRequest.id, reviewRating, reviewComment.trim());
      setRequests((prev: AssistanceRequest[]) =>
        prev.map((r: AssistanceRequest) => (r.id === reviewRequest.id ? { ...r, review: savedReview } : r))
      );
      setReviewRequest(null);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredRequests = requests.filter((r: AssistanceRequest) => {
    if (activeTab === 'pending') {
      return r.status === 'pending';
    }
    if (activeTab === 'in_progress') {
      return r.status === 'accepted';
    }
    if (activeTab === 'completed') {
      return r.status === 'completed';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader title="My Requests" showBack />
      <View style={styles.container}>
        {!isAuthenticated ? (
          <View style={styles.authRequired}>
            <Text style={styles.authEmoji}>🔐</Text>
            <Text style={styles.authTitle}>Sign in to view requests</Text>
            <Text style={styles.authSubtitle}>
              Log in with your Driver or Mechanic account to view active breakdown assistance and history.
            </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/login')}
              variant="primary"
              size="large"
              style={styles.authBtn}
            />
          </View>
        ) : (
          <>
            {/* Tab Filter matching Mockup 10 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
                onPress={() => setActiveTab('pending')}
              >
                <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
                  Pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.tabBtn, activeTab === 'in_progress' && styles.tabBtnActive]}
                onPress={() => setActiveTab('in_progress')}
              >
                <Text style={[styles.tabText, activeTab === 'in_progress' && styles.tabTextActive]}>
                  In Progress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
                onPress={() => setActiveTab('completed')}
              >
                <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                  Completed
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#EA580C" />
                <Text style={styles.loadingText}>Loading your requests...</Text>
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                <Button title="Retry" onPress={fetchRequests} variant="secondary" size="small" />
              </View>
            ) : (
              <FlatList
                data={filteredRequests}
                keyExtractor={(item: AssistanceRequest) => item.id.toString()}
                renderItem={({ item }: { item: AssistanceRequest }) => (
                  <RequestCard
                    request={item}
                    userRole={user?.profile.role}
                    onOpenChat={handleOpenChat}
                    onUpdateStatus={handleUpdateStatus}
                    onOpenReview={handleOpenReview}
                  />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={['#EA580C']}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📋</Text>
                    <Text style={styles.emptyTitle}>No requests in this category</Text>
                    <Text style={styles.emptySubtitle}>
                      {user?.profile.role === 'driver'
                        ? 'Need roadside help? Search mechanics or submit an emergency assistance request.'
                        : 'New requests from stranded drivers will appear here.'}
                    </Text>
                    {user?.profile.role === 'driver' && (
                      <Button
                        title="Find Mechanics"
                        onPress={() => router.push('/mechanics')}
                        variant="primary"
                        size="medium"
                        style={styles.emptyActionBtn}
                      />
                    )}
                  </View>
                }
              />
            )}
          </>
        )}

        {/* CHAT MODAL */}
        <Modal
          visible={!!chatRequest}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setChatRequest(null)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request #{chatRequest?.id} Discussion</Text>
                <Text style={styles.modalSubtitle}>Issue: {chatRequest?.issue}</Text>
              </View>
              <TouchableOpacity onPress={() => setChatRequest(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {loadingMessages ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color="#EA580C" />
                <Text style={styles.loadingText}>Loading conversation...</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.chatScroll}>
                {messages.length === 0 ? (
                  <Text style={styles.noMessagesText}>
                    No messages yet. Send a message to coordinate arrival, location, or vehicle status.
                  </Text>
                ) : (
                  messages.map((m: RequestMessage) => {
                    const isMe = m.sender === user?.id;
                    return (
                      <View
                        key={m.id}
                        style={[
                          styles.chatBubble,
                          isMe ? styles.chatBubbleMe : styles.chatBubbleOther,
                        ]}
                      >
                        <Text style={styles.senderLabel}>
                          {isMe ? 'You' : m.sender_name || `User #${m.sender}`}
                        </Text>
                        <Text style={[styles.chatText, isMe ? styles.chatTextMe : styles.chatTextOther]}>
                          {m.message}
                        </Text>
                        <Text style={styles.chatTimestamp}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={newMessageText}
                onChangeText={setNewMessageText}
              />
              <Button
                title="Send"
                onPress={handleSendMessage}
                loading={sendingMessage}
                variant="primary"
                size="small"
              />
            </View>
          </SafeAreaView>
        </Modal>

        {/* REVIEW MODAL */}
        <Modal
          visible={!!reviewRequest}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setReviewRequest(null)}
        >
          <View style={styles.reviewModalOverlay}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Rate Mechanic</Text>
              <Text style={styles.reviewSubtitle}>
                How was your repair service for request #{reviewRequest?.id}?
              </Text>

              {reviewError && <Text style={styles.errorText}>⚠️ {reviewError}</Text>}

              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Text style={[styles.starIcon, star <= reviewRating && styles.starActive]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Leave feedback on arrival time, professionalism, and repair quality..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={reviewComment}
                onChangeText={setReviewComment}
              />

              <View style={styles.reviewActions}>
                <Button
                  title="Cancel"
                  onPress={() => setReviewRequest(null)}
                  variant="ghost"
                  size="small"
                />
                <Button
                  title="Submit Review"
                  onPress={handleSubmitReview}
                  loading={submittingReview}
                  variant="primary"
                  size="small"
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <BottomNav activeTab="requests" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  authRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  authEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  authBtn: {
    minWidth: 160,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#EA580C',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionBtn: {
    marginTop: 6,
  },
  // Modal Styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F172A',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#F97316',
    fontWeight: '700',
    fontSize: 14,
  },
  chatScroll: {
    padding: 16,
    flexGrow: 1,
  },
  noMessagesText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
    lineHeight: 20,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  chatBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#EA580C',
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  chatText: {
    fontSize: 14,
  },
  chatTextMe: {
    color: '#FFFFFF',
  },
  chatTextOther: {
    color: '#0F172A',
  },
  chatTimestamp: {
    fontSize: 9,
    color: '#CBD5E1',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  // Review Modal
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  reviewSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  starIcon: {
    fontSize: 32,
    color: '#CBD5E1',
  },
  starActive: {
    color: '#F59E0B',
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
