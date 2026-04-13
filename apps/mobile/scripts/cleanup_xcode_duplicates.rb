require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
resources_phase = target.resources_build_phase
plist = 'GoogleService-Info.plist'

# Fazlalık olan dosyayı bulalım (ios/App/GoogleService-Info.plist)
# Xcode'da dosya referansları genellikle dosya ismine göre tutulur ama full path de önemlidir.
# Hepsini tarayıp duplicate'leri temizleyeceğiz.

items_to_remove = []
correct_path = "App/#{plist}"

resources_phase.files.each do |build_file|
  next unless build_file.file_ref
  
  file_path = build_file.file_ref.path
  next unless file_path&.include?(plist)
  
  puts "Found #{plist} in build phase. Path: #{file_path}"
  
  # Keep only App/GoogleService-Info.plist, remove all others
  if file_path != correct_path
    puts "Marking #{file_path} for removal (not #{correct_path})..."
    items_to_remove << build_file
  else
    puts "Keeping correct path: #{correct_path}"
  end
end

if items_to_remove.empty?
  puts "✅ No duplicates found. All #{plist} references are correct."
else
  puts "🧹 Removing #{items_to_remove.size} duplicate(s)..."
  items_to_remove.each do |f|
    resources_phase.remove_build_file(f)
    puts "  ❌ Removed: #{f.file_ref.path}"
  end
  
  # Verify correct file still exists
  correct_exists = resources_phase.files.any? do |f|
    f.file_ref && f.file_ref.path == correct_path
  end
  
  unless correct_exists
    puts "⚠️  Correct path missing, attempting to re-add..."
    
    # Find App group
    app_group = project.main_group['App'] || project.main_group.groups.find { |g| g.name == 'App' }
    
    if app_group
      file_ref = app_group.files.find { |f| f.path == plist }
      
      if file_ref
        resources_phase.add_file_reference(file_ref)
        puts "✅ Re-added #{correct_path}"
      else
        puts "❌ Could not find #{plist} in App group"
      end
    else
      puts "❌ Could not find App group in project"
    end
  end
end

project.save
puts "Project saved and cleaned."
