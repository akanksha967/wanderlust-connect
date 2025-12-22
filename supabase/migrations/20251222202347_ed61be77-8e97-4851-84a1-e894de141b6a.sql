-- Add validation trigger for messages content length
-- Using a trigger instead of CHECK constraint for better flexibility

CREATE OR REPLACE FUNCTION public.validate_message_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Check that content is not empty after trimming
  IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN
    RAISE EXCEPTION 'Message content cannot be empty';
  END IF;
  
  -- Check content length limit (5000 characters max)
  IF length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 5000 characters';
  END IF;
  
  -- Trim whitespace from content
  NEW.content := trim(NEW.content);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for message validation
DROP TRIGGER IF EXISTS validate_message_content_trigger ON public.messages;
CREATE TRIGGER validate_message_content_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_content();

-- Also add validation for reports description field
CREATE OR REPLACE FUNCTION public.validate_report_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate reason is not empty
  IF NEW.reason IS NULL OR length(trim(NEW.reason)) = 0 THEN
    RAISE EXCEPTION 'Report reason cannot be empty';
  END IF;
  
  -- Limit reason length
  IF length(NEW.reason) > 100 THEN
    RAISE EXCEPTION 'Report reason exceeds maximum length of 100 characters';
  END IF;
  
  -- Limit description length if provided
  IF NEW.description IS NOT NULL AND length(NEW.description) > 2000 THEN
    RAISE EXCEPTION 'Report description exceeds maximum length of 2000 characters';
  END IF;
  
  -- Trim whitespace
  NEW.reason := trim(NEW.reason);
  IF NEW.description IS NOT NULL THEN
    NEW.description := trim(NEW.description);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for report validation
DROP TRIGGER IF EXISTS validate_report_content_trigger ON public.reports;
CREATE TRIGGER validate_report_content_trigger
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_report_content();