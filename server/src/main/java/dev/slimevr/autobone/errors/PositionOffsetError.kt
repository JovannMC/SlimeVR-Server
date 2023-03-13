package dev.slimevr.autobone.errors

import com.jme3.math.FastMath
import dev.slimevr.autobone.AutoBoneTrainingStep
import dev.slimevr.poseframeformat.trackerdata.TrackerFrames
import dev.slimevr.tracking.processor.skeleton.HumanSkeleton

// The difference between offset of absolute position and the corresponding point over time
class PositionOffsetError : IAutoBoneError {
	@Throws(AutoBoneException::class)
	override fun getStepError(trainingStep: AutoBoneTrainingStep): Float {
		val trackers = trainingStep.trainingFrames.frameHolders
		return getPositionOffsetError(
			trackers,
			trainingStep.cursor1,
			trainingStep.cursor2,
			trainingStep.humanPoseManager1.skeleton,
			trainingStep.humanPoseManager2.skeleton
		)
	}

	fun getPositionOffsetError(
		trackers: List<TrackerFrames>,
		cursor1: Int,
		cursor2: Int,
		skeleton1: HumanSkeleton,
		skeleton2: HumanSkeleton,
	): Float {
		var offset = 0f
		var offsetCount = 0
		for (tracker in trackers) {
			val trackerFrame1 = tracker.tryGetFrame(cursor1) ?: continue
			val position1 = trackerFrame1.tryGetPosition() ?: continue
			val trackerRole1 = trackerFrame1.tryGetTrackerPosition()?.trackerRole ?: continue

			val trackerFrame2 = tracker.tryGetFrame(cursor2) ?: continue
			val position2 = trackerFrame2.tryGetPosition() ?: continue
			val trackerRole2 = trackerFrame2.tryGetTrackerPosition()?.trackerRole ?: continue

			val computedTracker1 = skeleton1.getComputedTracker(trackerRole1) ?: continue
			val computedTracker2 = skeleton2.getComputedTracker(trackerRole2) ?: continue

			val dist1 = (computedTracker1.position - position1).len()
			val dist2 = (computedTracker2.position - position2).len()
			offset += FastMath.abs(dist2 - dist1)
			offsetCount++
		}
		return if (offsetCount > 0) offset / offsetCount else 0f
	}
}