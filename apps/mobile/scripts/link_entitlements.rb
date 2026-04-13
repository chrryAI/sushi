require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

# App.entitlements dosyasını bul veya ekle
file_name = 'App.entitlements'
group = project.main_group['App']

# Dosya referansı var mı?
file_ref = group.files.find { |f| f.path == file_name }

if !file_ref
  file_ref = group.new_reference(file_name)
  puts "Added #{file_name} to file references."
else
  puts "#{file_name} reference exists."
end

# Build settings güncelle
target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  # Bundle ID'yi de garantiye alalım
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'dev.chrry'
end

project.save
puts "Project saved: Updated Entitlements and Bundle ID."
