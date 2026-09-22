'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/ui/shared'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  /** Review a renovation project… */
  bookingId?: string
  /** …or a maintenance service request. Exactly one of the two. */
  maintenanceRequestId?: string
  subjectName: string
  existingReview?: { rating: number; comment: string } | null
}

export default function ReviewForm({ bookingId, maintenanceRequestId, subjectName, existingReview }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (existingReview && !success) {
    return (
      <div className="bg-sage-50 border border-sage-200 p-4">
        <p className="font-medium text-sage-800 text-sm">✓ You have already reviewed this</p>
        <div className="flex items-center gap-2 mt-2">
          <StarRating rating={existingReview.rating} size="sm" />
          <span className="text-sm text-sage-700">({existingReview.rating}/5)</span>
        </div>
        {existingReview.comment && <p className="text-sm text-sage-700 mt-2 italic">&ldquo;{existingReview.comment}&rdquo;</p>}
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-sage-50 border border-sage-200 p-4 text-center">
        <p className="text-2xl mb-2">🌟</p>
        <p className="font-medium text-sage-800">Thank you for your review!</p>
        <p className="text-sm text-sage-700 mt-1">Your feedback helps HomeServe get better.</p>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingId ? { booking_id: bookingId, rating, comment } : { maintenance_request_id: maintenanceRequestId, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to submit review'); return }
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        How was your experience with HomeServe on <strong>{subjectName}</strong>?
      </p>

      {/* Star picker */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-paper-200'}`}
          >
            ★
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-stone-500 self-center ml-2">{['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'][rating]}</span>}
      </div>

      <Textarea
        label="Your review (optional)"
        placeholder="Share your experience — what went well, what could be better..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <Button onClick={handleSubmit} loading={loading} disabled={rating === 0} className="w-full">
        Submit Review
      </Button>
    </div>
  )
}
