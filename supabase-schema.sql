-- ============================================================
-- DSA TRACKER - Complete Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topic TEXT NOT NULL,
  description TEXT,
  link TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table (daily tracking)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  solved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id, solved_date)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_solved_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_progress_user_date ON public.user_progress(user_id, solved_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_question ON public.user_progress(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Questions: everyone can read, only admins can write
CREATE POLICY "Questions are viewable by everyone" ON public.questions FOR SELECT USING (TRUE);
CREATE POLICY "Admins can insert questions" ON public.questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can update questions" ON public.questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can delete questions" ON public.questions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- User progress: users manage only their own
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.user_progress FOR DELETE USING (auth.uid() = user_id);
-- Admins can view all progress
CREATE POLICY "Admins can view all progress" ON public.user_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Streaks: users manage only their own
CREATE POLICY "Users can view own streak" ON public.streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streak" ON public.streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.streaks FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update streak when progress is recorded
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_current INTEGER;
  v_longest INTEGER;
BEGIN
  SELECT last_solved_date, current_streak, longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.streaks
  WHERE user_id = p_user_id;

  IF v_last_date IS NULL THEN
    -- First ever solve
    UPDATE public.streaks
    SET current_streak = 1, longest_streak = 1, last_solved_date = p_date, updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF v_last_date = p_date THEN
    -- Already solved today, no change
    NULL;
  ELSIF v_last_date = p_date - INTERVAL '1 day' THEN
    -- Consecutive day
    v_current := v_current + 1;
    v_longest := GREATEST(v_longest, v_current);
    UPDATE public.streaks
    SET current_streak = v_current, longest_streak = v_longest, last_solved_date = p_date, updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken
    UPDATE public.streaks
    SET current_streak = 1, last_solved_date = p_date, updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SAMPLE DATA - 15 Questions across 5 topics
-- ============================================================
INSERT INTO public.questions (title, difficulty, topic, description, link, order_index) VALUES

-- Arrays
('Two Sum', 'Easy', 'Arrays', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'https://leetcode.com/problems/two-sum/', 1),
('Best Time to Buy and Sell Stock', 'Easy', 'Arrays', 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit.', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 2),
('Product of Array Except Self', 'Medium', 'Arrays', 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].', 'https://leetcode.com/problems/product-of-array-except-self/', 3),
('Maximum Subarray', 'Medium', 'Arrays', 'Given an integer array nums, find the subarray with the largest sum, and return its sum. (Kadane''s Algorithm)', 'https://leetcode.com/problems/maximum-subarray/', 4),

-- Strings
('Valid Anagram', 'Easy', 'Strings', 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.', 'https://leetcode.com/problems/valid-anagram/', 1),
('Longest Substring Without Repeating Characters', 'Medium', 'Strings', 'Given a string s, find the length of the longest substring without repeating characters.', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 2),
('Group Anagrams', 'Medium', 'Strings', 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.', 'https://leetcode.com/problems/group-anagrams/', 3),

-- Trees
('Maximum Depth of Binary Tree', 'Easy', 'Trees', 'Given the root of a binary tree, return its maximum depth.', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', 1),
('Validate Binary Search Tree', 'Medium', 'Trees', 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).', 'https://leetcode.com/problems/validate-binary-search-tree/', 2),
('Binary Tree Level Order Traversal', 'Medium', 'Trees', 'Given the root of a binary tree, return the level order traversal of its nodes'' values (i.e., from left to right, level by level).', 'https://leetcode.com/problems/binary-tree-level-order-traversal/', 3),

-- Dynamic Programming
('Climbing Stairs', 'Easy', 'Dynamic Programming', 'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top?', 'https://leetcode.com/problems/climbing-stairs/', 1),
('Coin Change', 'Medium', 'Dynamic Programming', 'Given an array of coin denominations and an amount, find the minimum number of coins needed to make up that amount.', 'https://leetcode.com/problems/coin-change/', 2),
('Longest Common Subsequence', 'Medium', 'Dynamic Programming', 'Given two strings text1 and text2, return the length of their longest common subsequence.', 'https://leetcode.com/problems/longest-common-subsequence/', 3),

-- Graphs
('Number of Islands', 'Medium', 'Graphs', 'Given an m x n 2D binary grid which represents a map of land and water, return the number of islands.', 'https://leetcode.com/problems/number-of-islands/', 1),
('Clone Graph', 'Medium', 'Graphs', 'Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph.', 'https://leetcode.com/problems/clone-graph/', 2)

ON CONFLICT DO NOTHING;
