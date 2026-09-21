"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  ArrowUpDown,
  Filter,
  ThumbsUp,
  Quote,
  X,
} from "lucide-react";

interface ReviewUser {
  id: string;
  name: string;
  email?: string;
  displayName?: string;
  role?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: ReviewUser;
  buddy?: ReviewUser;
}

interface Stats {
  total: number;
  avgRating: number;
  ratingBreakdown: Record<number, number>;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, avgRating: 0, ratingBreakdown: {} });
  const [providers, setProviders] = useState<ReviewUser[]>([]);
  const [members, setMembers] = useState<ReviewUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sorting & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<string>("date-desc");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ userId: "", buddyId: "", rating: 5, comment: "" });
  const [addLoading, setAddLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  async function fetchReviews(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      let sortBy = "createdAt";
      let order = "desc";

      if (sortOption === "date-asc") {
        sortBy = "createdAt";
        order = "asc";
      } else if (sortOption === "rating-desc") {
        sortBy = "rating";
        order = "desc";
      } else if (sortOption === "rating-asc") {
        sortBy = "rating";
        order = "asc";
      } else if (sortOption === "user-asc") {
        sortBy = "userName";
        order = "asc";
      } else if (sortOption === "buddy-asc") {
        sortBy = "buddyName";
        order = "asc";
      }

      const params = new URLSearchParams({
        sortBy,
        order,
      });

      if (selectedRating !== "ALL") {
        params.append("rating", selectedRating);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`/api/admin/reviews?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
        if (data.providers) setProviders(data.providers);
        if (data.members) setMembers(data.members);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load reviews", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, [sortOption, selectedRating, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Review updated successfully!");
        setEditModalOpen(false);
        setEditingReview(null);
        fetchReviews(true);
      } else {
        showToast(data.message || "Failed to update review", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating review", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (review: Review) => {
    setDeletingReview(review);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingReview) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deletingReview.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Review deleted successfully!");
        setDeleteModalOpen(false);
        setDeletingReview(null);
        fetchReviews(true);
      } else {
        showToast(data.message || "Failed to delete review", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting review", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Submit New Review
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.userId || !addForm.buddyId) {
      showToast("Please select both a reviewer and target provider", "error");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Review added successfully!");
        setAddModalOpen(false);
        setAddForm({ userId: "", buddyId: "", rating: 5, comment: "" });
        fetchReviews(true);
      } else {
        showToast(data.message || "Failed to add review", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error creating review", "error");
    } finally {
      setAddLoading(false);
    }
  };

  // Five-star renderer helper
  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect && onSelect(star)}
            className={`${
              interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-700 text-slate-700"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* TOAST ALERT */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold transition animate-bounce ${
            toast.type === "success"
              ? "bg-emerald-950 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950 border-rose-500/50 text-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            Feedback Moderation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Reviews & Member Ratings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor, edit, and moderate feedback submitted across the platform for Breakup Buddies, Relationship Managers, and Dates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchReviews(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg relative overflow-hidden">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
            Total Reviews
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">submitted</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg relative overflow-hidden">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
            Average Rating
          </span>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-amber-400">{stats.avgRating.toFixed(1)}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i <= Math.round(stats.avgRating) ? "fill-amber-400 text-amber-400" : "fill-slate-700 text-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg relative overflow-hidden">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
            5★ Top Ratings
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {stats.ratingBreakdown[5] || 0}
            </span>
            <span className="text-xs text-slate-400">
              ({stats.total > 0 ? Math.round(((stats.ratingBreakdown[5] || 0) / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg relative overflow-hidden">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
            Needs Attention (≤ 3★)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400">
              {(stats.ratingBreakdown[1] || 0) + (stats.ratingBreakdown[2] || 0) + (stats.ratingBreakdown[3] || 0)}
            </span>
            <span className="text-xs text-slate-400">critical</span>
          </div>
        </div>
      </div>

      {/* FILTER & SORT TOOLBAR */}
      <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reviewer, email, buddy, or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#162136] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#162136] border border-white/10 text-slate-200 focus:outline-none focus:border-amber-500/50 font-medium"
            >
              <option value="date-desc">🕒 Newest First</option>
              <option value="date-asc">⌛ Oldest First</option>
              <option value="rating-desc">⭐ Rating: High to Low</option>
              <option value="rating-asc">📉 Rating: Low to High</option>
              <option value="user-asc">👤 Reviewer Name (A-Z)</option>
              <option value="buddy-asc">🤝 Provider Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Rating Pills Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Rating:
          </span>
          <button
            onClick={() => setSelectedRating("ALL")}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              selectedRating === "ALL"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5"
            }`}
          >
            All Ratings ({stats.total})
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(String(r))}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition ${
                selectedRating === String(r)
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5"
              }`}
            >
              <span>{r}★</span>
              <span className="text-[10px] opacity-75">({stats.ratingBreakdown[r] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS TABLE */}
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#131d2e] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Reviewer</th>
                <th className="px-4 py-3.5">Target Provider</th>
                <th className="px-4 py-3.5">Rating</th>
                <th className="px-5 py-3.5">Testimonial</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span>Loading member reviews...</span>
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Quote className="w-8 h-8 text-white/10" />
                      <p className="font-bold text-white text-sm">No reviews found</p>
                      <p className="text-xs text-slate-500">
                        {searchQuery || selectedRating !== "ALL"
                          ? "No reviews match your filter criteria. Try resetting your search."
                          : "No reviews submitted yet. Click 'Add Review' above to create one."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((rv) => (
                  <tr key={rv.id} className="hover:bg-white/[0.02] transition group">
                    {/* Reviewer */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {rv.user?.name ? rv.user.name[0] : "U"}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{rv.user?.name || "Anonymous Member"}</p>
                          <p className="text-[11px] text-slate-400">{rv.user?.email || "N/A"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Target Provider */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-xs">
                          {rv.buddy?.displayName || rv.buddy?.name || "Provider"}
                        </span>
                        <span className="text-[10px] text-amber-400 font-medium">
                          {rv.buddy?.role === "MATCHMAKER"
                            ? "Relationship Manager"
                            : rv.buddy?.role === "BREAKUP_BUDDY"
                            ? "Breakup Buddy"
                            : rv.buddy?.role === "DATE_MATCH"
                            ? "Date Match"
                            : "Service / Date"}
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {renderStars(rv.rating)}
                        </div>
                        <span className="text-[11px] font-bold text-amber-400">
                          {rv.rating}.0 / 5.0
                        </span>
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-5 py-4 max-w-md">
                      <p className="text-slate-300 text-xs line-clamp-2 italic leading-relaxed">
                        &ldquo;{rv.comment || "No written testimonial provided."}&rdquo;
                      </p>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(rv.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(rv)}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition active:scale-95"
                          title="Edit Review"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(rv)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition active:scale-95"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT REVIEW MODAL */}
      {editModalOpen && editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111c2e] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit Member Review</h3>
                  <p className="text-xs text-slate-400">Modify rating score and testimonial content</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Reviewer / Target Context info */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Reviewer</span>
                  <span className="text-white font-semibold text-xs">{editingReview.user?.name || "Member"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Target Provider</span>
                  <span className="text-amber-400 font-semibold text-xs">
                    {editingReview.buddy?.displayName || editingReview.buddy?.name || "Provider"}
                  </span>
                </div>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Rating Score (1 - 5 Stars)</label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#162136] border border-white/10">
                  {renderStars(editRating, true, setEditRating)}
                  <span className="text-sm font-black text-amber-400 ml-2">{editRating} of 5 Stars</span>
                </div>
              </div>

              {/* Testimonial Textarea */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Testimonial Comment</label>
                <textarea
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Enter member feedback comment..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#162136] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-blue-500/50 leading-relaxed placeholder-slate-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && deletingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111c2e] border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Review?</h3>
                <p className="text-xs text-slate-400">This action will permanently remove this feedback.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 text-xs space-y-2">
              <p className="text-slate-300">
                Review by <strong className="text-white">{deletingReview.user?.name || "Member"}</strong> for{" "}
                <strong className="text-amber-400">
                  {deletingReview.buddy?.displayName || deletingReview.buddy?.name || "Provider"}
                </strong>
                :
              </p>
              <p className="italic text-slate-400">&ldquo;{deletingReview.comment || "No comment"}&rdquo;</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD REVIEW MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111c2e] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add New Member Review</h3>
                  <p className="text-xs text-slate-400">Record a testimonial for a provider or service</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
              {/* Select Reviewer */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Select Reviewer (Member)</label>
                <select
                  required
                  value={addForm.userId}
                  onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#162136] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Target Provider */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Select Target Provider</label>
                <select
                  required
                  value={addForm.buddyId}
                  onChange={(e) => setAddForm({ ...addForm, buddyId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#162136] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">-- Choose Provider / Buddy / RM --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName || p.name} ({p.role === "MATCHMAKER" ? "Relationship Manager" : "Breakup Buddy"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">Rating Score</label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#162136] border border-white/10">
                  {renderStars(addForm.rating, true, (r) => setAddForm({ ...addForm, rating: r }))}
                  <span className="text-sm font-black text-amber-400 ml-2">{addForm.rating} of 5 Stars</span>
                </div>
              </div>

              {/* Testimonial */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Testimonial Comment</label>
                <textarea
                  required
                  rows={3}
                  value={addForm.comment}
                  onChange={(e) => setAddForm({ ...addForm, comment: e.target.value })}
                  placeholder="Share feedback details or experience notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#162136] border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 placeholder-slate-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {addLoading ? "Creating..." : "Add Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
