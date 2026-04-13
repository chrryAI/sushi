require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first
resources_phase = target.resources_build_phase

puts "Scanning Copy Bundle Resources..."

# Tüm GoogleService-Info.plist girişlerini sil (Temiz sayfa açalım)
files_to_remove = []
resources_phase.files.each do |build_file|
  next unless build_file.file_ref
  
  # File ref name veya path'i kontrol et
  fname = build_file.file_ref.name || ""
  fpath = build_file.file_ref.path || ""
  
  if fname.include?('GoogleService-Info.plist') || fpath.include?('GoogleService-Info.plist')
    puts "Found duplicate: #{fname} - Path: #{fpath}"
    files_to_remove << build_file
  end
end

files_to_remove.each do |f|
  resources_phase.remove_build_file(f)
end
puts "Removed #{files_to_remove.count} references from build phase."

# Şimdi sadece App grubunun altındakini (App/App/GoogleService-Info.plist) bulup ekleyelim
group = project.main_group['App'] # Bu "App" grubu fiziksel olarak "App/App" klasörüne bakar
file_ref = group.files.find { |f| f.path == 'GoogleService-Info.plist' }

if file_ref
  resources_phase.add_file_reference(file_ref)
  puts "✅ Added correct reference: #{file_ref.path} (from App group)"
else
  # Eğer referans yoksa oluştur
  puts "Reference not found in App group. Creating it..."
  file_ref = group.new_reference('GoogleService-Info.plist')
  resources_phase.add_file_reference(file_ref)
  puts "✅ Created and added reference."
end

project.save
puts "Project saved successfully."
