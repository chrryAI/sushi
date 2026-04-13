require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Target'ı bul (Genelde ilk target "App"tir)
target = project.targets.first

# GoogleService-Info.plist dosyasını bul veya ekle
file_name = 'GoogleService-Info.plist'
file_path = 'App/GoogleService-Info.plist'

# Grubu bul (App grubu)
group = project.main_group['App']

# Dosya referansı var mı kontrol et
file_ref = group.files.find { |f| f.path == file_name }

if file_ref
  puts "#{file_name} already exists in project."
else
  # Dosyayı gruba ekle
  file_ref = group.new_reference(file_name)
  puts "Added #{file_name} to file references."
end

# Build phase'e ekle (Copy Bundle Resources)
resources_phase = target.resources_build_phase
build_file = resources_phase.files.find { |f| f.file_ref == file_ref }

if build_file
  puts "#{file_name} already in Copy Bundle Resources build phase."
else
  resources_phase.add_file_reference(file_ref)
  puts "Added #{file_name} to Copy Bundle Resources."
end

project.save
puts "Project saved."
